import React, { useState } from 'react';

function UploadComponent() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');

  // Convierte el archivo a base64
  const fileToBase64 = file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });

  const handleChange = e => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const base64 = await fileToBase64(file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: base64 })
    });
    const data = await response.json();
    setUrl(data.url); // URL de Cloudinary
  };

  return (
    <div>
      <input type="file" onChange={handleChange} />
      <button onClick={handleUpload}>Subir archivo</button>
      {url && (
        <div>
          <p>Archivo subido:</p>
          <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
          <img src={url} alt="Subido" style={{ maxWidth: 200 }} />
        </div>
      )}
    </div>
  );
}

export default UploadComponent;
