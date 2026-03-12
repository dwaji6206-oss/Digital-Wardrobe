/**
 * 衣服详情弹窗组件
 * 显示衣服的完整信息，支持删除操作
 */

import { useState } from 'react';
import { X, Trash2, Loader2 } from 'lucide-react';

export default function ClothingDetailModal({ clothing, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('确定要删除这件衣服吗？此操作不可恢复。')) return;
    setDeleting(true);
    try {
      await onDelete(clothing.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="glass-modal w-full max-w-2xl rounded-3xl overflow-hidden"
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
          {/* 左侧图片 */}
          <div className="md:w-1/2 bg-gray-100/50 p-4">
            <div className="bg-white/30 rounded-2xl h-full min-h-[300px] flex items-center justify-center p-2">
              <img
                src={clothing.image_url}
                alt={clothing.code}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* 右侧信息 */}
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
            <h2 className="text-xl font-light tracking-wider text-gray-900 mb-6">衣服详情</h2>

            <div className="space-y-4 flex-1">
              <InfoRow label="编号" value={clothing.code} />
              <InfoRow label="名称" value={clothing.clothing_names?.name} />
              <InfoRow label="颜色" value={clothing.clothing_colors?.name} />
              {clothing.material && <InfoRow label="材质" value={clothing.material} />}
              {clothing.length && <InfoRow label="长度" value={clothing.length} />}
              {clothing.description && (
                <div className="pt-2">
                  <span className="text-sm text-gray-400">简介</span>
                  <p className="text-gray-700 mt-1">{clothing.description}</p>
                </div>
              )}
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
                删除衣服
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-gray-900 font-medium">{value || '-'}</span>
    </div>
  );
}
