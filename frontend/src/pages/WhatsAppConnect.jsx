import React, { useState } from 'react';

export default function WhatsAppConnect() {
  const [qrCode, setQrCode] = useState("");
  const [status, setStatus] = useState("Aguardando ação...");
  const [loading, setLoading] = useState(false);

  // O React roda no navegador do usuário, então ele precisa acessar a porta 48080 do servidor
  const EVOLUTION_API_URL = "http://localhost:48080"; 
  const API_KEY = "medsched_global_secret_key";
  const INSTANCE_NAME = "clinica_matriz";

  const fetchQRCode = async () => {
    setLoading(true);
    setStatus("Buscando QR Code...");
    try {
      // Tenta conectar ou buscar a instância existente
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: {
          'apikey': API_KEY
        }
      });
      
      const data = await response.json();
      
      if (data.base64) {
        setQrCode(data.base64);
        setStatus("QR Code gerado! Aponte o celular.");
      } else if (data.instance?.state === "open") {
        setStatus("✅ WhatsApp já está conectado!");
        setQrCode("");
      } else {
        setStatus("Erro ao ler status. Tente novamente.");
      }
    } catch (error) {
      console.error(error);
      setStatus("❌ Erro de conexão. Verifique se a API está rodando.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-4 mt-10">
      <h1 className="text-2xl font-bold text-gray-800 text-center">Conectar WhatsApp</h1>
      <p className="text-gray-500 text-center text-sm">
        Conecte o número da clínica para habilitar os disparos automáticos.
      </p>
      
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-[300px]">
        {qrCode ? (
          <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
        ) : (
          <div className="text-gray-400 flex flex-col items-center text-center">
            <svg className="w-16 h-16 mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <p className="font-medium text-gray-600">{status}</p>
          </div>
        )}
      </div>

      <button 
        onClick={fetchQRCode}
        disabled={loading}
        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:bg-gray-400"
      >
        {loading ? "Carregando..." : "Gerar QR Code"}
      </button>
    </div>
  );
}
