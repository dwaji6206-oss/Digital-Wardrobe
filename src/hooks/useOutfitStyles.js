/**
 * 搭配风格管理 Hook
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useOutfitStyles() {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStyles();
  }, []);

  async function fetchStyles() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const { data, error: fetchError } = await supabase
        .from('outfit_styles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setStyles(data || []);
    } catch (err) {
      console.error('获取风格列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addStyle(name) {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const exists = styles.some(s => s.name === name);
      if (exists) throw new Error('该风格已存在');

      const { data, error: insertError } = await supabase
        .from('outfit_styles')
        .insert([{ user_id: user.id, name: name.trim() }])
        .select();

      if (insertError) throw insertError;
      setStyles([...styles, data[0]]);
      return data[0];
    } catch (err) {
      console.error('添加风格失败:', err);
      setError(err.message);
      throw err;
    }
  }

  async function deleteStyle(id) {
    try {
      setError(null);
      const { error: deleteError } = await supabase.from('outfit_styles').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setStyles(styles.filter(s => s.id !== id));
    } catch (err) {
      console.error('删除风格失败:', err);
      setError(err.message);
      throw err;
    }
  }

  return { styles, loading, error, fetchStyles, addStyle, deleteStyle };
}
