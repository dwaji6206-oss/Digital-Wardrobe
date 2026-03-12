/**
 * 搭配详情弹窗组件
 * 展示搭配的完整信息，包含搭配图片、详细信息和组成衣服列表
 */

import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Loader2, Calendar, Sun, Sparkles, FileText, Shirt, Camera, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SUPABASE_CONFIG } from '../../lib/supabase';

export default function OutfitDetailModal({ outfit, onClose, onDelete, onUpdateOutfit }) {
  const [deleting, setDeleting] = useState(false);
  const [loadingClothes, setLoadingClothes] = useState(false);
  const [outfitClothes, setOutfitClothes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [feedbackImages, setFeedbackImages] = useState(outfit.feedback_images || []);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (outfit?.clothes_ids?.length > 0) {
      fetchOutfitClothes();
    }
    setFeedbackImages(outfit.feedback_images || []);
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

  async function handleUploadFeedback(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const timestamp = Date.now();
      const filePath = `${user.id}/feedback_${timestamp}.png`;

      const { error: uploadError } = await supabase
        .storage.from(SUPABASE_CONFIG.STORAGE_BUCKETS.OUTFITS)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage.from(SUPABASE_CONFIG.STORAGE_BUCKETS.OUTFITS)
        .getPublicUrl(filePath);

      // 更新数据库
      const newImages = [...feedbackImages, publicUrl];
      const { error: updateError } = await supabase
        .from('outfits')
        .update({ feedback_images: newImages })
        .eq('id', outfit.id);

      if (updateError) throw updateError;

      setFeedbackImages(newImages);
      if (onUpdateOutfit) {
        onUpdateOutfit({ ...outfit, feedback_images: newImages });
      }
    } catch (err) {
      console.error('上传反馈图片失败:', err);
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDeleteFeedback(imageUrl) {
    if (!confirm('确定要删除这张反馈图片吗？')) return;

    try {
      const newImages = feedbackImages.filter(url => url !== imageUrl);

      const { error: updateError } = await supabase
        .from('outfits')
        .update({ feedback_images: newImages })
        .eq('id', outfit.id);

      if (updateError) throw updateError;

      // 尝试删除存储桶中的图片
      try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(p => p === 'outfits-images');
        if (bucketIndex !== -1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          await supabase.storage.from(SUPABASE_CONFIG.STORAGE_BUCKETS.OUTFITS).remove([filePath]);
        }
      } catch (e) {
        console.warn('删除图片文件失败:', e);
      }

      setFeedbackImages(newImages);
      if (onUpdateOutfit) {
        onUpdateOutfit({ ...outfit, feedback_images: newImages });
      }
    } catch (err) {
      console.error('删除反馈图片失败:', err);
      alert(err.message);
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
        className="glass-modal w-full max-w-4xl rounded-3xl overflow-hidden select-none"
        onClick={e => e.stopPropagation()}
        style={{ cursor: 'default' }}
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
          <div className="md:w-1/2 bg-gray-100/50 p-4">
            <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden">
              <img
                src={outfit.image_url}
                alt={outfit.title || '搭配'}
                className="w-full h-full object-cover"
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

              {/* 搭配灵感 */}
              {outfit.description && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-400">搭配灵感</span>
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

                <div className="max-h-[180px] overflow-y-auto bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                  {loadingClothes ? (
                    <div className="grid grid-cols-3 gap-2">
                      {outfit.clothes_ids?.slice(0, 6).map((_, index) => (
                        <div
                          key={index}
                          className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse"
                        />
                      ))}
                    </div>
                  ) : outfitClothes.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {outfitClothes.map(cloth => (
                        <div
                          key={cloth.id}
                          className="group relative bg-white/60 rounded-xl overflow-hidden aspect-[3/4] border border-gray-100"
                          style={{ cursor: 'default' }}
                        >
                          <img
                            src={cloth.image_url}
                            alt={cloth.code}
                            className="w-full h-full object-contain p-1 pointer-events-none"
                            draggable={false}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-1.5 text-center">
                            <span className="text-xs text-gray-600 font-medium">{cloth.code}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 bg-gray-50 rounded-xl p-3">
                      暂无衣服信息
                    </div>
                  )}
                </div>
              </div>

              {/* 反馈区域 */}
              <div className="pt-4 border-t border-gray-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-400">
                      穿搭反馈 ({feedbackImages.length})
                    </span>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-full hover:bg-gray-800 disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Plus size={12} />
                    )}
                    上传
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFeedback}
                    className="hidden"
                  />
                </div>

                <div className="max-h-[180px] overflow-y-auto bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                  {feedbackImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {feedbackImages.map((url, index) => (
                        <div
                          key={index}
                          className="group relative bg-white/60 rounded-xl overflow-hidden aspect-[3/4] border border-gray-100"
                        >
                          <img
                            src={url}
                            alt={`反馈 ${index + 1}`}
                            className="w-full h-full object-cover pointer-events-none"
                            draggable={false}
                          />
                          <button
                            onClick={() => handleDeleteFeedback(url)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-4">
                      点击上方"上传"添加穿着实景照片
                    </div>
                  )}
                </div>
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
