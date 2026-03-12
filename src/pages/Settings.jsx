/**
 * 标签管理页面
 * 管理服装名称和颜色标签
 */

import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { useClothingNames } from '../hooks/useClothingNames';
import { useClothingColors } from '../hooks/useClothingColors';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export default function Settings() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-light tracking-wider text-gray-900 mb-8">标签管理</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <NameManager />
          <ColorManager />
        </div>
      </div>
    </div>
  );
}

function NameManager() {
  const { names, loading, addName, deleteName } = useClothingNames();
  const [newName, setNewName] = useState('');
  const [newAbbr, setNewAbbr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newName.trim() || !newAbbr.trim()) return;
    try {
      setSubmitting(true);
      await addName(newName, newAbbr);
      setNewName('');
      setNewAbbr('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-light tracking-wider mb-4">服装名称</h2>
      <form onSubmit={handleSubmit} className="mb-4 space-y-3">
        <input
          type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="名称（如：衬衫）" maxLength={10}
          className="input-glass"
        />
        <input
          type="text" value={newAbbr} onChange={(e) => setNewAbbr(e.target.value)}
          placeholder="缩写（如：CS）" maxLength={10}
          className="input-glass"
        />
        <button
          type="submit" disabled={submitting || !newName.trim() || !newAbbr.trim()}
          className="w-full btn-primary flex items-center justify-center"
        >
          {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus size={16} className="mr-2" />}
          添加
        </button>
      </form>
      {loading ? (
        <div className="text-center py-4 text-gray-400">加载中...</div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {names.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-white/60 p-3 rounded-xl">
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="ml-2 text-gray-400 text-sm">({item.abbreviation})</span>
              </div>
              <button onClick={() => deleteName(item.id)} className="text-gray-400 hover:text-red-500 p-2">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {names.length === 0 && <p className="text-center text-gray-400 py-4">暂无数据</p>}
        </div>
      )}
    </div>
  );
}

function ColorManager() {
  const { colors, loading, addColor, deleteColor } = useClothingColors();
  const [newName, setNewName] = useState('');
  const [newAbbr, setNewAbbr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newName.trim() || !newAbbr.trim()) return;
    try {
      setSubmitting(true);
      await addColor(newName, newAbbr);
      setNewName('');
      setNewAbbr('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-light tracking-wider mb-4">颜色</h2>
      <form onSubmit={handleSubmit} className="mb-4 space-y-3">
        <input
          type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="颜色（如：蓝色）" maxLength={10}
          className="input-glass"
        />
        <input
          type="text" value={newAbbr} onChange={(e) => setNewAbbr(e.target.value)}
          placeholder="缩写（如：be）" maxLength={10}
          className="input-glass"
        />
        <button
          type="submit" disabled={submitting || !newName.trim() || !newAbbr.trim()}
          className="w-full btn-primary flex items-center justify-center"
        >
          {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus size={16} className="mr-2" />}
          添加
        </button>
      </form>
      {loading ? (
        <div className="text-center py-4 text-gray-400">加载中...</div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {colors.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-white/60 p-3 rounded-xl">
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="ml-2 text-gray-400 text-sm">({item.abbreviation})</span>
              </div>
              <button onClick={() => deleteColor(item.id)} className="text-gray-400 hover:text-red-500 p-2">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {colors.length === 0 && <p className="text-center text-gray-400 py-4">暂无数据</p>}
        </div>
      )}
    </div>
  );
}
