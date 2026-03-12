/**
 * 保存搭配弹窗组件
 * 用于保存搭配到数据库，包含标题、季节、风格、简介等字段
 */

import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';

export default function SaveOutfitModal({ onClose, onSave, canvasItems }) {
  const [title, setTitle] = useState('');
  const [season, setSeason] = useState('');
  const [style, setStyle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 季节选项
  const seasonOptions = ['春季', '夏季', '秋季', '冬季'];
  const styleOptions = ['休闲', '正式', '运动', '复古', '简约', '街头', '商务', '约会', '度假'];

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // 获取画布上的所有衣服ID
      const clothesIds = canvasItems
        .map(item => item.clothingId)
        .filter(id => id != null);

      await onSave({
        title,
        season,
        style,
        description,
        clothes_ids: clothesIds
      });

      onClose();
    } catch (err) {
      setError(err.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="glass-modal w-full max-w-md rounded-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <h2 className="text-xl font-light tracking-wider text-gray-900">保存搭配</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          {/* 标题 */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">
              标题 <span className="text-gray-300">(选填，20字内)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 20))}
              placeholder="给搭配起个名字"
              className="input-glass"
            />
            <div className="text-right text-xs text-gray-400 mt-1">{title.length}/20</div>
          </div>

          {/* 季节 */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">
              季节 <span className="text-gray-300">(选填)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {seasonOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSeason(season === opt ? '' : opt)}
                  className={`pill ${season === opt ? 'pill-active' : 'pill-inactive'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 风格 */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">
              风格 <span className="text-gray-300">(选填)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStyle(style === opt ? '' : opt)}
                  className={`pill ${style === opt ? 'pill-active' : 'pill-inactive'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 简介 */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">
              简介 <span className="text-gray-300">(选填，300字内)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 300))}
              placeholder="描述一下这套搭配..."
              rows={4}
              className="input-glass resize-none"
            />
            <div className="text-right text-xs text-gray-400 mt-1">{description.length}/300</div>
          </div>

          {/* 衣服数量提示 */}
          <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
            此搭配包含 <span className="font-medium text-gray-700">{canvasItems?.length || 0}</span> 件衣服
          </div>

          {/* 提交按钮 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center"
            >
              {saving ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <Save size={18} className="mr-2" />
              )}
              保存搭配
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
