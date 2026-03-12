import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useClothingNames() {
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNames();
  }, []);

  async function fetchNames() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const { data, error: fetchError } = await supabase
        .from('clothing_names')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setNames(data || []);
    } catch (err) {
      console.error('获取名称列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addName(name, abbreviation) {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const exists = names.some(n => n.name === name || n.abbreviation === abbreviation);
      if (exists) throw new Error('该名称或缩写已存在');

      const { data, error: insertError } = await supabase
        .from('clothing_names')
        .insert([{ user_id: user.id, name: name.trim(), abbreviation: abbreviation.trim().toUpperCase() }])
        .select();

      if (insertError) throw insertError;
      setNames([...names, data[0]]);
      return data[0];
    } catch (err) {
      console.error('添加名称失败:', err);
      setError(err.message);
      throw err;
    }
  }

  async function deleteName(id) {
    try {
      setError(null);
      const { error: deleteError } = await supabase.from('clothing_names').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setNames(names.filter(n => n.id !== id));
    } catch (err) {
      console.error('删除名称失败:', err);
      setError(err.message);
      throw err;
    }
  }

  return { names, loading, error, fetchNames, addName, deleteName };
}
