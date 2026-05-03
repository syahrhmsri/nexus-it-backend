const { createClient } = require('@supabase/supabase-js')
const { successResponse, errorResponse } = require('../utils/response')
const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')
const { recordAuditLog } = require('../utils/audit')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// ==========================================
// HELPER: Generate Asset Code (e.g., AST-2026-001)
// ==========================================
const generateAssetCode = async (category) => {
  const prefixes = {
    laptop: 'LTP',
    desktop: 'DSK',
    server: 'SRV',
    printer: 'PRT',
    network_device: 'NET',
    other: 'AST'
  }
  const prefix = prefixes[category] || 'AST'
  const year = new Date().getFullYear()

  // Hitung jumlah asset untuk nomor urut
  const { count } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })

  const number = String((count || 0) + 1).padStart(3, '0')
  return `${prefix}-${year}-${number}`
}

// ==========================================
// 1. CREATE ASSET
// ==========================================
const createAsset = async (req, res) => {
  try {
    const { name, category, brand, serial_number, location, assigned_to, condition } = req.body
    
    if (!name || !category) {
      return errorResponse(res, 'Nama dan Kategori wajib diisi.', 400)
    }

    const assetCode = await generateAssetCode(category)

    const { data, error } = await supabase
      .from('assets')
      .insert({
        asset_code: assetCode,
        name,
        category,
        brand,
        serial_number,
        location,
        assigned_to,
        condition: condition || 'good',
        status: 'active',
        photo: req.file ? req.file.filename : null
      })
      .select()
      .single()

    if (error) throw error

    // Log ke Audit Logs
    await recordAuditLog(
      req.user.id, 
      `Registered asset ${assetCode}`, 
      'assets', 
      `Name: ${name}, Category: ${category}`
    )

    return successResponse(res, { asset: data }, 'Asset berhasil didaftarkan!', 201)
  } catch (error) {
    console.error('createAsset Error:', error)
    return errorResponse(res, 'Gagal mendaftarkan asset.', 500)
  }
}

// ==========================================
// 2. GET ALL ASSETS (With Filter & Search)
// ==========================================
const getAssets = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 10 } = req.query
    
    let query = supabase
      .from('assets')
      .select(`
        *,
        assignee:assigned_to (id, name, email, department)
      `, { count: 'exact' })

    if (category) query = query.eq('category', category)
    if (status) query = query.eq('status', status)
    if (search) query = query.ilike('name', `%${search}%`)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return successResponse(res, {
      assets: data,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit)
      }
    })
  } catch (error) {
    return errorResponse(res, 'Gagal mengambil data asset.', 500)
  }
}

const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    // Sederhanakan query untuk menghindari Join Error sementara
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Supabase Error:', error?.message);
      return errorResponse(res, 'Asset tidak ditemukan.', 404);
    }

    // Pastikan data dibungkus dalam objek { asset: data } sesuai keinginan frontend
    return successResponse(res, { asset: data });
  } catch (error) {
    console.error('System Error:', error.message);
    return errorResponse(res, 'Gagal mengambil detail asset.', 500);
  }
};

// ==========================================
// 4. UPDATE ASSET
// ==========================================
const updateAsset = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body }

    if (req.file) {
      updateData.photo = req.file.filename
    }

    const { data, error } = await supabase
      .from('assets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log ke Audit Logs
    await recordAuditLog(
      req.user.id, 
      `Updated asset ${data.asset_code}`, 
      'assets', 
      `Updated fields: ${Object.keys(req.body).join(', ')}`
    )

    return successResponse(res, { asset: data }, 'Asset berhasil diperbarui!')
  } catch (error) {
    return errorResponse(res, 'Gagal memperbarui asset.', 500)
  }
}

// ==========================================
// 5. GET ASSET STATS (Untuk Dashboard Week 3)
// ==========================================
const getAssetStats = async (req, res) => {
  try {
    const { data: allAssets, error } = await supabase.from('assets').select('status, category')
    if (error) throw error

    const stats = {
      total: allAssets.length,
      active: allAssets.filter(a => a.status === 'active').length,
      maintenance: allAssets.filter(a => a.status === 'maintenance').length,
      retired: allAssets.filter(a => a.status === 'retired').length
    }

    return successResponse(res, { stats })
  } catch (error) {
    return errorResponse(res, 'Gagal mengambil statistik asset.', 500)
  }
}

// ==========================================
// 6. GENERATE QR CODE
// ==========================================
const getAssetQRCode = async (req, res) => {
  try {
    const { id } = req.params
    
    // 1. Ambil data asset untuk isi QR
    const { data: asset, error } = await supabase
      .from('assets')
      .select('id, asset_code, name')
      .eq('id', id)
      .single()

    if (error || !asset) return errorResponse(res, 'Asset tidak ditemukan.', 404)

    // 2. Generate QR sebagai Data URL (Base64)
    // Isi QR dengan URL Detail Asset agar bisa di-scan langsung ke browser HP
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const qrValue = `${frontendUrl}/assets/${asset.id}`
    
    const qrBase64 = await QRCode.toDataURL(qrValue, {
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      width: 600,
      margin: 2
    })

    return successResponse(res, { 
      qr_url: qrBase64 
    })

  } catch (error) {
    console.error('QR Error:', error)
    return errorResponse(res, 'Gagal membuat QR Code.', 500)
  }
}

// ==========================================
// 7. DELETE ASSET
// ==========================================
const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params

    // Ambil data asset dulu untuk log
    const { data: asset } = await supabase.from('assets').select('asset_code').eq('id', id).single()

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Log ke Audit Logs
    if (asset) {
      await recordAuditLog(
        req.user.id, 
        `Deleted asset ${asset.asset_code}`, 
        'assets', 
        `ID: ${id}`
      )
    }

    return successResponse(res, null, 'Asset berhasil dihapus!')
  } catch (error) {
    return errorResponse(res, 'Gagal menghapus asset.', 500)
  }
}

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  getAssetStats,
  getAssetQRCode,
  deleteAsset
}