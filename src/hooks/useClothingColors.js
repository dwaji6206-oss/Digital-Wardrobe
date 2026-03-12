import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useClothingColors() {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchColors();
  }, []);

  async function fetchColors() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const { data, error: fetchError } = await supabase
        .from('clothing_colors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setColors(data || []);
    } catch (err) {
      console.error('获取颜色列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addColor(name, abbreviation) {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const exists = colors.some(c => c.name === name || c.abbreviation === abbreviation);
      if (exists) throw new Error('该颜色或缩写已存在');

      const { data, error: insertError } = await supabase
        .from('clothing_colors')
        .insert([{ user_id: user.id, name: name.trim(), abbreviation: abbreviation.trim().toLowerCase() }])
        .select();

      if (insertError) throw insertError;
      setColors([...colors, data[0]]);
      return data[0];
    } catch (err) {
      console.error('添加颜色失败:', err);
      setError(err.message);
      throw err;
    }
  }

  async function deleteColor(id) {
    try {
      setError(null);
      const { error: deleteError } = await supabase.from('clothing_colors').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setColors(colors.filter(c => c.id !== id));
    } catch (err) {
      console.error('删除颜色失败:', err);
      setError(err.message);
      throw err;
    }
  }

  return { colors, loading, error, fetchColors, addColor, deleteColor };
}
