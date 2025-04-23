import React, { useState, useEffect } from 'react';
import { LogOut, Info, ExternalLink, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface CredentialCard {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  imageUrl: string;
  planRequired: 'free' | 'premium' | 'team';
  category: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [credentials, setCredentials] = useState<CredentialCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  
  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const preventInspection = async () => {
      if (window.api) {
        try {
          await window.api.preventInspection();
        } catch (error) {
          console.error('Error preventing inspection:', error);
        }
      }
    };
    
    const fetchCredentials = async () => {
      try {
        setLoading(true);
        const data = await api.getCredentials();
        
        // Format credentials
        const formattedCredentials = data.map((cred: any) => ({
          id: cred.id,
          name: cred.service,
          description: cred.description || '',
          status: cred.status,
          imageUrl: cred.image_url || 'placeholder.png',
          planRequired: cred.plan_required || 'premium',
          category: cred.category || 'General'
        }));
        
        const filteredCredentials = formattedCredentials.filter((cred: CredentialCard) => {
          const planHierarchy: Record<string, number> = { 'free': 0, 'premium': 1, 'team': 2 };
          const userPlan = (user?.plan as 'free' | 'premium' | 'team') || 'free';
          return planHierarchy[userPlan] >= planHierarchy[cred.planRequired];
        });
        
        let securedCredentials = filteredCredentials;
        if (window.api) {
          try {
            securedCredentials = await window.api.secureCredentials(filteredCredentials);
          } catch (error) {
            console.error('Error securing credentials:', error);
          }
        }
        
        const uniqueCategories = Array.from(
          new Set(securedCredentials.map((cred: CredentialCard) => cred.category))
        ) as string[];
        
        setCategories(['all', ...uniqueCategories]);
        setCredentials(securedCredentials);
      } catch (error) {
        console.error('Error fetching credentials:', error);
        setError('Error al cargar las credenciales. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      preventInspection();
      fetchCredentials();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMessage(null);
    
    if (newPassword !== confirmPassword) {
      setPasswordChangeMessage({
        type: 'error',
        text: 'Las contraseñas nuevas no coinciden'
      });
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordChangeMessage({
        type: 'error',
        text: 'La contraseña debe tener al menos 8 caracteres'
      });
      return;
    }
    
    try {
      if (window.api) {
        const result = await window.api.changePassword(oldPassword, newPassword);
        
        if (result.success) {
          setPasswordChangeMessage({
            type: 'success',
            text: result.message
          });
          
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          
          setTimeout(() => {
            setShowPasswordChange(false);
            setPasswordChangeMessage(null);
          }, 2000);
        } else {
          setPasswordChangeMessage({
            type: 'error',
            text: result.message
          });
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordChangeMessage({
        type: 'error',
        text: 'Error al cambiar la contraseña. Por favor, intenta de nuevo.'
      });
    }
  };

  const openTool = async (id: string) => {
    try {
      const credential = await api.getCredentialById(id);
      
      const toolWindow = window.open('about:blank', '_blank');
      
      if (!toolWindow) {
        setError('No se pudo abrir la herramienta. Por favor, permite las ventanas emergentes.');
        return;
      }
      
      let secureCredential = credential;
      if (window.api) {
        try {
          secureCredential = await window.api.secureCredentials(credential);
        } catch (error) {
          console.error('Error securing credential:', error);
        }
      }
      
      toolWindow.document.write(`
        <html>
          <head>
            <title>Conectando a ${secureCredential.service}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
              }
              .loader {
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin-right: 20px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .container {
                text-align: center;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
              }
              .secure-badge {
                display: inline-flex;
                align-items: center;
                background-color: #e6f7ff;
                color: #0066cc;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                margin-top: 10px;
              }
              .secure-badge svg {
                margin-right: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="loader"></div>
              <div>
                <h2>Conectando a ${secureCredential.service}</h2>
                <p>Por favor espera mientras te conectamos...</p>
                <div class="secure-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Conexión segura
                </div>
              </div>
            </div>
            <script>
              document.addEventListener('contextmenu', event => event.preventDefault());
              
              document.addEventListener('keydown', function(e) {
                if (
                  e.keyCode === 123 || 
                  (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67))
                ) {
                  e.preventDefault();
                }
              });
              
              setTimeout(() => {
                window.location.href = "${secureCredential.url || 'https://example.com'}";
              }, 2000);
            </script>
          </body>
        </html>
      `);
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
        <p className="text-gray-600 mb-6">Accede a todas tus herramientas premium desde un solo lugar.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* Category filter */}
        {categories.length > 1 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category === 'all' ? 'Todas' : category}
                </button>
              ))}
            </div>
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
            {credentials
              .filter(cred => selectedCategory === 'all' || cred.category === selectedCategory)
              .map((credential) => (
              <div key={credential.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-40 bg-gray-100 flex items-center justify-center p-4">
                  <img 
                    src={credential.imageUrl} 
                    alt={credential.name} 
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22150%22%20height%3D%22150%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18d2e1f0a7d%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18d2e1f0a7d%22%3E%3Crect%20width%3D%22150%22%20height%3D%22150%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2255%22%20y%3D%2280%22%3E150x150%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                    }}
                  />
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{credential.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      credential.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {credential.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-2 text-xs text-gray-500">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">
                      {credential.category}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      Plan: {credential.planRequired.charAt(0).toUpperCase() + credential.planRequired.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{credential.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => openTool(credential.id)}
                      disabled={credential.status !== 'active'}
                      className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        credential.status === 'active'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <ExternalLink size={16} className="mr-2" />
                        <span>Abrir herramienta</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Cambiar Contraseña</h3>
            
            {passwordChangeMessage && (
              <div className={`mb-4 p-3 rounded-md ${
                passwordChangeMessage.type === 'success' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {passwordChangeMessage.text}
              </div>
            )}
            
            <form onSubmit={handlePasswordChange}>
              <div className="mb-4">
                <label htmlFor="oldPassword" className="block text-gray-700 text-sm font-medium mb-2">
                  Contraseña Actual
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-gray-700 text-sm font-medium mb-2">
                  Nueva Contraseña
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* User Settings Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setShowPasswordChange(true)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Cambiar Contraseña"
        >
          <Lock size={20} />
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
