/**
 * 搭配详情弹窗组件
 * 展示搭配的完整信息，包含搭配图片、详细信息和组成衣服列表
 */

import { useState, useEffect } from 'react';
import { X, Trash2, Loader2, Calendar, Sun, Sparkles, FileText, Shirt } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function OutfitDetailModal({ outfit, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [loadingClothes, setLoadingClothes] = useState(false);
  const [outfitClothes, setOutfitClothes] = useState([]);

  useEffect(() => {
    if (outfit?.clothes_ids?.length > 0) {
      fetchOutfitClothes();
    }
  }, [outfit]);

  async function fetchOutfitClothes() {
    try {
      setLoadingClothes(true);
      const { data, error } = await supabase
        .from('clothes')
        .select('id, code, image_url, clothing_names(name), clothing_colors(name)')
        .in('id', outfit.clothes_ids);

      if (error) throw error;
      setOutfitClothes(data || []);
    } catch (err) {
      console.error('获取搭配衣服失败:', err);
    } finally {
      setLoadingClothes(false);
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这套搭配吗？此操作不可恢复。')) return;
    setDeleting(true);
    try {
      await onDelete(outfit.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // 格式化日期
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="glass-modal w-full max-w-4xl rounded-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/50 rounded-full hover:bg-white/80 transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* 左侧：搭配大图 */}
          <div className="md:w-1/2 bg-gray-100/50 p-6">
            <div className="bg-white/30 rounded-2xl h-full min-h-[400px] flex items-center justify-center p-4">
              <img
                src={outfit.image_url}
                alt={outfit.title || '搭配'}
                className="w-full h-full object-contain max-h-[500px]"
              />
            </div>
          </div>

          {/* 右侧：搭配信息 */}
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-light tracking-wider text-gray-900 mb-6">
              {outfit.title || '我的搭配'}
            </h2>

            {/* 详细信息 */}
            <div className="space-y-4 flex-1">
              {/* 创建时间 */}
              <InfoRow
                icon={<Calendar size={16} className="text-gray-400" />}
                label="创建时间"
                value={formatDate(outfit.created_at)}
              />

              {/* 季节 */}
              {outfit.season && (
                <InfoRow
                  icon={<Sun size={16} className="text-orange-400" />}
                  label="季节"
                  value={outfit.season}
                />
              )}

              {/* 风格 */}
              {outfit.style && (
                <InfoRow
                  icon={<Sparkles size={16} className="text-purple-400" />}
                  label="风格"
                  value={outfit.style}
                />
              )}

              {/* 简介 */}
              {outfit.description && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-400">简介</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">
                    {outfit.description}
                  </p>
                </div>
              )}

              {/* 组成衣服列表 */}
              <div className="pt-4 border-t border-gray-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <Shirt size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-400">
                    包含衣服 ({outfit.clothes_ids?.length || 0} 件)
                  </span>
                </div>

                {loadingClothes ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-gray-400" size={20} />
                  </div>
                ) : outfitClothes.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {outfitClothes.map(cloth => (
                      <div
                        key={cloth.id}
                        className="group relative bg-white/60 rounded-xl overflow-hidden aspect-[3/4] border border-gray-100"
                      >
                        <img
                          src={cloth.image_url}
                          alt={cloth.code}
                          className="w-full h-full object-contain p-1"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-1.5 text-center">
                          <span className="text-xs text-gray-600 font-medium">{cloth.code}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 bg-gray-50 rounded-xl p-3">
                    {outfit.clothes_ids?.length > 0 ? '加载中...' : '暂无衣服信息'}
                  </div>
                )}
              </div>
            </div>

            {/* 删除按钮 */}
            <div className="mt-6 pt-6 border-t border-gray-200/50">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <Trash2 size={18} className="mr-2" />
                )}
                删除搭配
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {icon}
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-gray-700 font-medium ml-auto">{value}</span>
    </div>
  );
}
