import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface CredentialCard {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  imageUrl: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [credentials, setCredentials] = useState<CredentialCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        setLoading(true);
        const data = await api.getCredentials();
        
        const formattedCredentials = data.map((cred: any) => ({
          id: cred.id,
          name: cred.service,
          description: cred.description || '',
          status: cred.status,
          imageUrl: cred.image_url || 'placeholder.png'
        }));
        
        setCredentials(formattedCredentials);
      } catch (error) {
        console.error('Error fetching credentials:', error);
        setError('Error al cargar las credenciales. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const openTool = async (id: string) => {
    try {
      const credential = await api.getCredentialById(id);
      
      console.log(`Opening tool with ID: ${id}`);
      
      console.log('Credential details:', credential);
    } catch (error) {
      console.error('Error opening tool:', error);
      setError('Error al abrir la herramienta. Por favor, intenta de nuevo.');
    }
  };

  if (!user) {
    return null; // AuthContext will handle redirection
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">XDropia Browser</h1>
            {user && (
              <p className="text-sm text-gray-500">
                Plan: <span className="font-medium">{user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}</span>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Herramientas</h2>
        <p className="text-gray-600 mb-8">Accede a todas tus herramientas premium desde un solo lugar.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : credentials.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600">No hay herramientas disponibles para tu plan actual.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {credentials.map((credential) => (
              <div key={credential.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-40 bg-gray-200 flex items-center justify-center">
                  <img 
                    src={credential.imageUrl} 
                    alt={credential.name} 
                    className="max-h-full max-w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22150%22%20height%3D%22150%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18d2e1f0a7d%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18d2e1f0a7d%22%3E%3Crect%20width%3D%22150%22%20height%3D%22150%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2255%22%20y%3D%2280%22%3E150x150%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{credential.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      credential.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {credential.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{credential.description}</p>
                  <button
                    onClick={() => openTool(credential.id)}
                    disabled={credential.status !== 'active'}
                    className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      credential.status === 'active'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Abrir herramienta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
