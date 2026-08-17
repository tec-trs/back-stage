import React, { useState } from 'react';
import { Button } from './Button.js';

interface CreateUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function CreateUrlModal({ isOpen, onClose, onSubmit, isLoading = false }: CreateUrlModalProps) {
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    urlType: 'api',
    description: '',
    method: 'GET',
    status: 'active',
    authRequired: false,
    healthcheckEnabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({
      label: '',
      url: '',
      urlType: 'api',
      description: '',
      method: 'GET',
      status: 'active',
      authRequired: false,
      healthcheckEnabled: false,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Nova URL</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Label</label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              placeholder="Ex: API Users"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">URL</label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              placeholder="https://api.example.com/users"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
            <select
              value={formData.urlType}
              onChange={(e) => setFormData({ ...formData, urlType: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option>api</option>
              <option>webhook</option>
              <option>public</option>
              <option>internal</option>
              <option>admin_panel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Método HTTP</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
              <option>PATCH</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="authRequired"
              checked={formData.authRequired}
              onChange={(e) => setFormData({ ...formData, authRequired: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="authRequired" className="text-sm font-medium text-slate-300">
              Requer Autenticação
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="healthcheck"
              checked={formData.healthcheckEnabled}
              onChange={(e) => setFormData({ ...formData, healthcheckEnabled: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="healthcheck" className="text-sm font-medium text-slate-300">
              Habilitar Healthcheck
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
