import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, RefreshCw, Users, BarChart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Credential {
  id: string;
  service: string;
  email: string;
  password: string;
  status: 'active' | 'inactive';
  plan: 'free' | 'premium' | 'team';
  expiresAt: string;
}

interface UserStat {
  plan: string;
  count: number;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [stats, setStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'credentials' | 'stats'>('credentials');
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [newCredential, setNewCredential] = useState<Partial<Credential>>({
    service: '',
    email: '',
    password: '',
    status: 'active',
    plan: 'premium',
    expiresAt: ''
  });

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const credentialsData = await api.getAllCredentials();
        setCredentials(credentialsData);
        
        const statsData = await api.getUserStats();
        setStats(statsData);
        
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
  };

  const handleAddCredential = async () => {
    if (newCredential.service && newCredential.email && newCredential.password && newCredential.expiresAt) {
      try {
        setLoading(true);
        
        const newCredentialData = {
          service: newCredential.service,
          email: newCredential.email,
          password: newCredential.password,
          status: newCredential.status as 'active' | 'inactive',
          plan: newCredential.plan as 'free' | 'premium' | 'team',
          expiresAt: newCredential.expiresAt
        };
        
        const addedCredential = await api.addCredential(newCredentialData);
        
        setCredentials([...credentials, addedCredential]);
        setShowAddCredential(false);
        setNewCredential({
          service: '',
          email: '',
          password: '',
          status: 'active',
          plan: 'premium',
          expiresAt: ''
        });
      } catch (error) {
        console.error('Error adding credential:', error);
        setError('Error al añadir la credencial. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleCredentialStatus = async (id: string) => {
    try {
      setLoading(true);
      
      const credential = credentials.find(cred => cred.id === id);
      if (!credential) return;
      
      const newStatus = credential.status === 'active' ? 'inactive' : 'active';
      await api.updateCredentialStatus(id, newStatus);
      
      setCredentials(
        credentials.map(cred => 
          cred.id === id 
            ? { ...cred, status: newStatus } 
            : cred
        )
      );
    } catch (error) {
      console.error('Error updating credential status:', error);
      setError('Error al actualizar el estado de la credencial. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.isAdmin) {
    return null; // AuthContext will handle redirection
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">XDropia Browser - Panel de Administración</h1>
            {user && (
              <p className="text-sm text-gray-500">
                Administrador: <span className="font-medium">{user.name}</span>
              </p>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <LogOut size={18} className="mr-1" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'credentials' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('credentials')}
            disabled={loading}
          >
            <div className="flex items-center">
              <RefreshCw size={18} className="mr-2" />
              <span>Credenciales</span>
            </div>
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'stats' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('stats')}
            disabled={loading}
          >
            <div className="flex items-center">
              <BarChart size={18} className="mr-2" />
              <span>Estadísticas</span>
            </div>
          </button>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {activeTab === 'credentials' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Gestión de Credenciales</h2>
              <button
                onClick={() => setShowAddCredential(true)}
                className="flex items-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus size={18} className="mr-1" />
                <span>Añadir Credencial</span>
              </button>
            </div>

            {showAddCredential && (
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Añadir Nueva Credencial</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Servicio
                    </label>
                    <input
                      type="text"
                      value={newCredential.service}
                      onChange={(e) => setNewCredential({...newCredential, service: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={newCredential.email}
                      onChange={(e) => setNewCredential({...newCredential, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={newCredential.password}
                      onChange={(e) => setNewCredential({...newCredential, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Fecha de Expiración
                    </label>
                    <input
                      type="date"
                      value={newCredential.expiresAt}
                      onChange={(e) => setNewCredential({...newCredential, expiresAt: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Estado
                    </label>
                    <select
                      value={newCredential.status}
                      onChange={(e) => setNewCredential({...newCredential, status: e.target.value as 'active' | 'inactive'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Plan
                    </label>
                    <select
                      value={newCredential.plan}
                      onChange={(e) => setNewCredential({...newCredential, plan: e.target.value as 'free' | 'premium' | 'team'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="team">Team</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddCredential(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddCredential}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correo Electrónico
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contraseña
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiración
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {credentials.map((credential) => (
                    <tr key={credential.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{credential.service}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{credential.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">••••••••</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{credential.plan}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{credential.expiresAt}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          credential.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {credential.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleCredentialStatus(credential.id)}
                          className={`mr-2 px-3 py-1 rounded-md ${
                            credential.status === 'active'
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {credential.status === 'active' ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas de Usuarios</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{stat.plan}</h3>
                    <Users size={24} className="text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stat.count}</p>
                  <p className="text-sm text-gray-500 mt-1">usuarios activos</p>
                </div>
              ))}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Usuarios por Plan</h3>
              <div className="h-64 flex items-end justify-around">
                {stats.map((stat, index) => {
                  const maxCount = Math.max(...stats.map(s => s.count));
                  const height = (stat.count / maxCount) * 100;
                  
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className={`w-16 ${
                          index === 0 ? 'bg-blue-400' : index === 1 ? 'bg-blue-600' : 'bg-blue-800'
                        } rounded-t-md`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="mt-2 text-sm font-medium text-gray-700">{stat.plan}</div>
                      <div className="text-xs text-gray-500">{stat.count} usuarios</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
