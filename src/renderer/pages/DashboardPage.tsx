import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CredentialCard {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  imageUrl: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [credentials, setCredentials] = useState<CredentialCard[]>([
    {
      id: '1',
      name: 'Minea',
      description: 'Asistente de investigación en la web para inteligencia de mercado',
      status: 'active',
      imageUrl: 'https://placeholder.com/150'
    },
    {
      id: '2',
      name: 'Adspy',
      description: 'Plataforma competitiva de inteligencia publicitaria',
      status: 'active',
      imageUrl: 'https://placeholder.com/150'
    },
    {
      id: '3',
      name: 'Midjourney',
      description: 'Generación avanzada de imágenes mediante IA',
      status: 'active',
      imageUrl: 'https://placeholder.com/150'
    }
  ]);

  const handleLogout = () => {
    navigate('/login');
  };

  const openTool = (id: string) => {
    console.log(`Opening tool with ID: ${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">XDropia Browser</h1>
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
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Abrir herramienta
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
