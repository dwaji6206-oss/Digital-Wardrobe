/**
 * 保存搭配弹窗组件
 * 用于保存搭配到数据库，包含标题、季节、风格、简介等字段
 */

import { useState } from 'react';
import { X, Loader2, Save, Plus } from 'lucide-react';
import { useOutfitStyles } from '../../hooks/useOutfitStyles';

export default function SaveOutfitModal({ onClose, onSave, canvasItems }) {
  const { styles, addStyle, fetchStyles } = useOutfitStyles();
  const [title, setTitle] = useState('');
  const [season, setSeason] = useState('');
  const [styleId, setStyleId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showStyleModal, setShowStyleModal] = useState(false);

  // 季节选项
  const seasonOptions = ['春季', '夏季', '秋季', '冬季'];

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // 获取画布上的所有衣服ID
      const clothesIds = canvasItems
        .map(item => item.clothingId)
        .filter(id => id != null);

      // 获取选中的风格名称
      const selectedStyle = styles.find(s => s.id === styleId);
      const styleName = selectedStyle?.name || '';

      await onSave({
        title,
        season,
        style: styleName,
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

  // 新建风格后刷新并选中
  async function handleStyleCreated(newStyle) {
    await fetchStyles();
    setStyleId(newStyle.id);
    setShowStyleModal(false);
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

          {/* 风格选择 + 新建 */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">
              风格 <span className="text-gray-300">(选填)</span>
            </label>
            <div className="flex gap-2">
              <select
                value={styleId}
                onChange={(e) => setStyleId(e.target.value)}
                className={`select-glass flex-1 ${styleId ? 'text-gray-900' : 'text-gray-400'}`}
              >
                <option value="">请选择</option>
                {styles.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowStyleModal(true)}
                className="px-3 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center"
                title="新建风格"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* 搭配灵感 */}
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">
              搭配灵感 <span className="text-gray-300">(选填，300字内)</span>
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

      {/* 新建风格弹窗 */}
      {showStyleModal && (
        <CreateStyleModal
          onClose={() => setShowStyleModal(false)}
          onCreate={handleStyleCreated}
          onAdd={addStyle}
        />
      )}
    </div>
  );
}

/**
 * 新建风格弹窗组件
 */
function CreateStyleModal({ onClose, onCreate, onAdd }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const newItem = await onAdd(name);
      onCreate(newItem);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="glass-modal w-full max-w-sm rounded-2xl p-5" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-light tracking-wider mb-4">新建风格</h3>

        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">风格名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：休闲、正式、运动"
              maxLength={10}
              className="input-glass"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              取消
            </button>
            <button type="submit" disabled={submitting || !name.trim()} className="flex-1 btn-primary">
              {submitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
