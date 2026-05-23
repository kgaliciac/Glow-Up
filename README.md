# 💄 GlowUp — App de Productos de Maquillaje

## ☁️ Capas de Nube

| Capa | Servicio | Tipo |
|------|----------|------|
| Hosting | Vercel | **PaaS** |
| Autenticación | Firebase Authentication | **SaaS** |
| Base de datos | Cloud Firestore | **PaaS** |

---

## 🚀 Cómo ejecutar localmente

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Firebase en `src/firebase.js`
1. Ve a https://console.firebase.google.com/
2. Crea un nuevo proyecto (ej: "glowup-app")
3. Agrega una app Web → copia el firebaseConfig → pégalo en src/firebase.js
4. Authentication → Sign-in method → Habilita Google
5. Firestore Database → Crear base de datos → Modo prueba

### 3. Reglas de Firestore
En Firebase Console → Firestore → Reglas:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /productos/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /favoritos_maquillaje/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Ejecutar
```bash
npm start
```

---

## 🌐 Cómo publicar en Vercel

1. Sube el código a GitHub (sin node_modules)
2. Entra a vercel.com → importa el repositorio → Deploy
3. En Firebase → Authentication → Dominios autorizados → agrega tu URL de Vercel

---

## ✅ Funcionalidades

- 🔐 Login con Google
- 📋 Ver todos los productos de maquillaje
- ➕ Agregar productos con foto, marca, categoría, precio, tono y calificación
- ❤️ Marcar favoritos
- 🔍 Buscar por nombre o marca
- 🗂 Filtrar por categoría (Labial, Base, Sombras, etc.)
- 🗑 Eliminar tus propios productos
- ⭐ Sistema de calificación con estrellas
