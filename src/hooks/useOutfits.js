/**
 * 搭配数据管理 Hook
 * 用于获取、添加、删除搭配数据
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SUPABASE_CONFIG } from '../lib/supabase';

export function useOutfits() {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOutfits();
  }, []);

  async function fetchOutfits() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const { data, error: fetchError } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOutfits(data || []);
    } catch (err) {
      console.error('获取搭配列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadOutfitImage(dataUrl, title) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    // 将 dataUrl 转换为 Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // 生成文件路径（只使用 ASCII 字符，避免 Supabase Storage 报错）
    const timestamp = Date.now();
    const safeTitle = (title || 'outfit').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20) || 'outfit';
    const filePath = `${user.id}/${safeTitle}_${timestamp}.png`;

    const { error: uploadError } = await supabase
      .storage.from(SUPABASE_CONFIG.STORAGE_BUCKETS.OUTFITS)
      .upload(filePath, blob, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase
      .storage.from(SUPABASE_CONFIG.STORAGE_BUCKETS.OUTFITS)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function addOutfit({ title, season, style, description, image_url, clothes_ids }) {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const { data, error: insertError } = await supabase
        .from('outfits')
        .insert([{
          user_id: user.id,
          title: title?.trim() || null,
          season: season?.trim() || null,
          style: style?.trim() || null,
          description: description?.trim() || null,
          image_url,
          clothes_ids: clothes_ids || []
        }])
        .select();

      if (insertError) throw insertError;
      setOutfits([data[0], ...outfits]);
      return data[0];
    } catch (err) {
      console.error('添加搭配失败:', err);
      setError(err.message);
      throw err;
    }
  }

  async function deleteOutfit(id) {
    try {
      setError(null);
      const outfit = outfits.find(o => o.id === id);
      if (!outfit) throw new Error('搭配不存在');

      // 删除数据库记录
      const { error: deleteError } = await supabase.from('outfits').delete().eq('id', id);
      if (deleteError) throw deleteError;

      // 尝试删除存储桶中的图片
      if (outfit.image_url) {
        try {
          const url = new URL(outfit.image_url);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.findIndex(p => p === 'outfits-images');
          if (bucketIndex !== -1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            await supabase.storage.from(SUPABASE_CONFIG.STORAGE_BUCKETS.OUTFITS).remove([filePath]);
          }
        } catch (e) {
          console.warn('删除图片文件失败:', e);
        }
      }

      setOutfits(outfits.filter(o => o.id !== id));
    } catch (err) {
      console.error('删除搭配失败:', err);
      setError(err.message);
      throw err;
    }
  }

  return { outfits, loading, error, fetchOutfits, addOutfit, deleteOutfit, uploadOutfitImage };
}
