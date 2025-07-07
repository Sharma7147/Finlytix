import React, { useState } from 'react';

const UploadBill = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = e => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) return alert('Please select a file.');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('https://finlytix-server.onrender.com/upload', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Uploaded and processing...');
      } else {
        setMessage(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setMessage('Upload error');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Upload Receipt</h2>
      <form onSubmit={handleUpload}>
        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadBill;
