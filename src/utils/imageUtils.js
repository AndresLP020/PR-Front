export const getProfileImageUrl = (imageName) => {
  if (!imageName) return '';
  const baseUrl = import.meta.env.VITE_API_URL;
  return `${baseUrl}/uploads/perfiles/${imageName}`;
};

export const handleImageError = (event, userName) => {
  console.log('❌ Error al cargar la imagen de perfil');
  event.target.src = ''; // Esto hará que se muestre la letra inicial
};
