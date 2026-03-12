import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SUPABASE_CONFIG } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

export function useClothes() {
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClothes();
  }, []);

  async function fetchClothes() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const { data, error: fetchError } = await supabase
        .from('clothes')
        .select('*, clothing_names(name, abbreviation), clothing_colors(name, abbreviation)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setClothes(data || []);
    } catch (err) {
      console.error('获取衣服列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateCode(nameAbbr, colorAbbr) {
    const { data: { user } } = await supabase.auth.getUser();

    // 清理缩写，只保留英文字母
    const cleanNameAbbr = (nameAbbr || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
    const cleanColorAbbr = (colorAbbr || '').replace(/[^a-zA-Z]/g, '').toLowerCase();

    // 如果清理后为空，使用默认值
    const finalNameAbbr = cleanNameAbbr || 'XX';
    const finalColorAbbr = cleanColorAbbr || 'xx';

    const { data: existingClothes, error: countError } = await supabase
      .from('clothes')
      .select('id, clothing_names!inner(abbreviation), clothing_colors!inner(abbreviation)')
      .eq('user_id', user.id)
      .eq('clothing_names.abbreviation', finalNameAbbr)
      .eq('clothing_colors.abbreviation', finalColorAbbr);

    if (countError) throw countError;

    const sortOrder = (existingClothes?.length || 0) + 1;
    const sortOrderStr = sortOrder.toString().padStart(3, '0');
    return `${finalNameAbbr}${finalColorAbbr}${sortOrderStr}`;
  }

  async function uploadImage(file, code) {
    const { data: { user } } = await supabase.auth.getUser();

    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true };
    let compressedFile;
    try {
      compressedFile = await imageCompression(file, options);
    } catch (err) {
      console.warn('图片压缩失败，使用原图:', err);
      compressedFile = file;
    }

    const ext = compressedFile.name.split('.').pop();
    const filePath = `${user.id}/${code}.${ext}`;

    const { error: uploadError } = await supabase
      .storage.from(SUPABASE_CONFIG.STORAGE_BUCKETS.CLOTHES)
      .upload(filePath, compressedFile, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase
      .storage.from(SUPABASE_CONFIG.STORAGE_BUCKETS.CLOTHES)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function addClothing({ nameId, colorId, material, length, description, imageFile }) {
    try {
      setError(null);

      const { data: nameData } = await supabase.from('clothing_names').select('abbreviation').eq('id', nameId).single();
      const { data: colorData } = await supabase.from('clothing_colors').select('abbreviation').eq('id', colorId).single();

      if (!nameData || !colorData) throw new Error('请先在设置中添加服装名称和颜色');

      const code = await generateCode(nameData.abbreviation, colorData.abbreviation);
      const imageUrl = await uploadImage(imageFile, code);

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error: insertError } = await supabase
        .from('clothes')
        .insert([{
          user_id: user.id,
          code,
          name_id: nameId,
          color_id: colorId,
          material: material?.trim() || '',
          length: length?.trim() || '',
          description: description?.trim() || '',
          image_url: imageUrl
        }])
        .select('*, clothing_names(name, abbreviation), clothing_colors(name, abbreviation)');

      if (insertError) throw insertError;
      setClothes([data[0], ...clothes]);
      return data[0];
    } catch (err) {
      console.error('添加衣服失败:', err);
      setError(err.message);
      throw err;
    }
  }

  async function deleteClothing(id) {
    try {
      setError(null);
      const clothing = clothes.find(c => c.id === id);
      if (!clothing) throw new Error('衣服不存在');

      const { error: deleteError } = await supabase.from('clothes').delete().eq('id', id);
      if (deleteError) throw deleteError;

      setClothes(clothes.filter(c => c.id !== id));
    } catch (err) {
      console.error('删除衣服失败:', err);
      setError(err.message);
      throw err;
    }
  }

  return { clothes, loading, error, fetchClothes, addClothing, deleteClothing };
}
