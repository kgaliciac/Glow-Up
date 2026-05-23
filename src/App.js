// src/App.js
import React, { useState, useEffect } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, setDoc, where, serverTimestamp
} from "firebase/firestore";
import "./App.css";

const VISTAS = { HOME: "home", DETALLE: "detalle", NUEVO: "nuevo", FAVORITOS: "favoritos" };
const CATEGORIAS = ["Todas", "Labial", "Base", "Sombras", "Rubor", "Delineador", "Máscara", "Corrector", "Iluminador", "Otro"];

export default function App() {
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState(VISTAS.HOME);
  const [productos, setProductos] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [productoActivo, setProductoActivo] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  const [form, setForm] = useState({
    nombre: "", marca: "", descripcion: "", precio: "",
    categoria: "Labial", tono: "", calificacion: "5"
  });
  const [imagenBase64, setImagenBase64] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setCargando(false); });
    return unsub;
  }, []);

  // Productos en tiempo real
  useEffect(() => {
    const q = query(collection(db, "productos"), orderBy("creadoEn", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Favoritos del usuario
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "favoritos_maquillaje"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setFavoritos(snap.docs.map((d) => d.data().productoId));
    });
    return unsub;
  }, [user]);

  const login = async () => await signInWithPopup(auth, provider);
  const logout = async () => { await signOut(auth); setFavoritos([]); };

  const toggleFavorito = async (productoId) => {
    if (!user) return;
    const favId = `${user.uid}_${productoId}`;
    const favRef = doc(db, "favoritos_maquillaje", favId);
    if (favoritos.includes(productoId)) {
      await deleteDoc(favRef);
    } else {
      await setDoc(favRef, { uid: user.uid, productoId, creadoEn: serverTimestamp() });
    }
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX) { h = (h * MAX) / w; w = MAX; }
        if (h > MAX) { w = (w * MAX) / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        setImagenBase64(base64);
        setImagenPreview(base64);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const publicarProducto = async () => {
    if (!form.nombre.trim() || !form.marca.trim()) {
      alert("Completa al menos el nombre y la marca.");
      return;
    }
    setGuardando(true);
    try {
      await addDoc(collection(db, "productos"), {
        ...form,
        precio: form.precio ? parseFloat(form.precio) : null,
        calificacion: parseInt(form.calificacion),
        imagenURL: imagenBase64 || "",
        autorNombre: user.displayName,
        autorFoto: user.photoURL,
        autorUID: user.uid,
        creadoEn: serverTimestamp(),
      });
      setForm({ nombre: "", marca: "", descripcion: "", precio: "", categoria: "Labial", tono: "", calificacion: "5" });
      setImagenBase64(null);
      setImagenPreview(null);
      setVista(VISTAS.HOME);
    } catch (err) {
      alert("Error al publicar: " + err.message);
    }
    setGuardando(false);
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    await deleteDoc(doc(db, "productos", id));
    setVista(VISTAS.HOME);
  };

  const abrirDetalle = (producto) => { setProductoActivo(producto); setVista(VISTAS.DETALLE); };

  const productosFiltrados = productos.filter((p) => {
    const matchBusqueda =
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = filtroCategoria === "Todas" || p.categoria === filtroCategoria;
    return matchBusqueda && matchCategoria;
  });

  const productosFavoritos = productos.filter((p) => favoritos.includes(p.id));

  const estrellas = (n) => "★".repeat(n) + "☆".repeat(5 - n);

  if (cargando) return (
    <div className="loading-screen"><div className="spinner" /><p>Cargando...</p></div>
  );

  // ── LOGIN
  if (!user) return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-emoji">💄</div>
        <h1>GlowUp</h1>
        <p>Tu catálogo personal de productos de maquillaje</p>
        <button className="btn-google" onClick={login}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Iniciar sesión con Google
        </button>
        <div className="login-capas">
          <span>☁️ SaaS: Firebase Auth</span>
          <span>☁️ PaaS: Firestore DB</span>
        </div>
      </div>
    </div>
  );

  // ── DETALLE
  if (vista === VISTAS.DETALLE && productoActivo) {
    const esFav = favoritos.includes(productoActivo.id);
    const esMio = productoActivo.autorUID === user.uid;
    return (
      <div className="app">
        <nav className="navbar">
          <button className="btn-back" onClick={() => setVista(VISTAS.HOME)}>← Volver</button>
          <span className="nav-title">💄 GlowUp</span>
          <img src={user.photoURL} alt="" className="avatar" />
        </nav>
        <div className="detalle-wrap">
          <div className="detalle-img-wrap">
            {productoActivo.imagenURL
              ? <img src={productoActivo.imagenURL} alt={productoActivo.nombre} className="detalle-img" />
              : <div className="detalle-noimg">💄</div>
            }
          </div>
          <div className="detalle-body">
            <div className="detalle-header">
              <div>
                <span className="tag">{productoActivo.categoria}</span>
                <h1 className="detalle-titulo">{productoActivo.nombre}</h1>
                <p className="detalle-marca">{productoActivo.marca}</p>
              </div>
              <button className={`btn-fav-grande ${esFav ? "activo" : ""}`} onClick={() => toggleFavorito(productoActivo.id)}>
                {esFav ? "❤️" : "🤍"}
              </button>
            </div>
            <div className="detalle-meta">
              <span className="estrellas">{estrellas(productoActivo.calificacion || 5)}</span>
              {productoActivo.precio && <span>💰 Q{productoActivo.precio}</span>}
              {productoActivo.tono && <span>🎨 {productoActivo.tono}</span>}
              <span>👤 {productoActivo.autorNombre}</span>
            </div>
            {productoActivo.descripcion && (
              <div className="detalle-seccion">
                <h2>Descripción</h2>
                <p className="detalle-desc">{productoActivo.descripcion}</p>
              </div>
            )}
            {esMio && (
              <button className="btn-eliminar-producto" onClick={() => eliminarProducto(productoActivo.id)}>
                🗑 Eliminar producto
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── NUEVO PRODUCTO
  if (vista === VISTAS.NUEVO) return (
    <div className="app">
      <nav className="navbar">
        <button className="btn-back" onClick={() => setVista(VISTAS.HOME)}>← Cancelar</button>
        <span className="nav-title">Nuevo producto</span>
        <button className="btn-publicar" onClick={publicarProducto} disabled={guardando}>
          {guardando ? "Guardando..." : "Publicar"}
        </button>
      </nav>
      <div className="form-wrap">
        <div className="form-img-upload" onClick={() => document.getElementById("img-input").click()}>
          {imagenPreview
            ? <img src={imagenPreview} alt="preview" className="form-img-preview" />
            : <div className="form-img-placeholder">📷<span>Toca para agregar foto</span></div>
          }
          <input id="img-input" type="file" accept="image/*" onChange={handleImagenChange} style={{ display: "none" }} />
        </div>
        <div className="form-group">
          <label>Nombre del producto *</label>
          <input name="nombre" value={form.nombre} onChange={handleFormChange} placeholder="Ej: Labial Matte Rojo" />
        </div>
        <div className="form-group">
          <label>Marca *</label>
          <input name="marca" value={form.marca} onChange={handleFormChange} placeholder="Ej: MAC, NYX, L'Oréal..." />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Categoría</label>
            <select name="categoria" value={form.categoria} onChange={handleFormChange}>
              {CATEGORIAS.filter(c => c !== "Todas").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Precio (Q)</label>
            <input name="precio" type="number" value={form.precio} onChange={handleFormChange} placeholder="150" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Tono / Color</label>
            <input name="tono" value={form.tono} onChange={handleFormChange} placeholder="Ej: Ruby Woo" />
          </div>
          <div className="form-group">
            <label>Calificación</label>
            <select name="calificacion" value={form.calificacion} onChange={handleFormChange}>
              <option value="5">★★★★★</option>
              <option value="4">★★★★☆</option>
              <option value="3">★★★☆☆</option>
              <option value="2">★★☆☆☆</option>
              <option value="1">★☆☆☆☆</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Descripción / Reseña</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleFormChange}
            placeholder="¿Qué te parece este producto? Duración, acabado, cobertura..." rows={5} />
        </div>
      </div>
    </div>
  );

  // ── FAVORITOS
  if (vista === VISTAS.FAVORITOS) return (
    <div className="app">
      <nav className="navbar">
        <button className="btn-back" onClick={() => setVista(VISTAS.HOME)}>← Volver</button>
        <span className="nav-title">❤️ Mis favoritos</span>
        <img src={user.photoURL} alt="" className="avatar" />
      </nav>
      <div className="home-wrap">
        {productosFavoritos.length === 0
          ? <div className="empty-state"><span>🤍</span><p>Aún no tienes productos favoritos</p></div>
          : <div className="productos-grid">
              {productosFavoritos.map(p => (
                <ProductoCard key={p.id} producto={p} esFav={true} onFav={toggleFavorito} onClick={() => abrirDetalle(p)} estrellas={estrellas} />
              ))}
            </div>
        }
      </div>
      <BottomNav vista={vista} setVista={setVista} />
    </div>
  );

  // ── HOME
  return (
    <div className="app">
      <nav className="navbar">
        <span className="nav-logo">💄 GlowUp</span>
        <div className="nav-user">
          <img src={user.photoURL} alt="" className="avatar" onClick={logout} title="Cerrar sesión" />
        </div>
      </nav>
      <div className="home-wrap">
        <div className="search-bar">
          <span>🔍</span>
          <input type="text" placeholder="Buscar productos o marcas..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="categorias-scroll">
          {CATEGORIAS.map(c => (
            <button key={c} className={`btn-categoria ${filtroCategoria === c ? "activo" : ""}`}
              onClick={() => setFiltroCategoria(c)}>{c}</button>
          ))}
        </div>
        <div className="seccion-header">
          <h2>{filtroCategoria === "Todas" ? "Todos los productos" : filtroCategoria}</h2>
          <span className="productos-count">{productosFiltrados.length} productos</span>
        </div>
        {productosFiltrados.length === 0
          ? <div className="empty-state"><span>💄</span><p>No hay productos aún. ¡Agrega el primero!</p></div>
          : <div className="productos-grid">
              {productosFiltrados.map(p => (
                <ProductoCard key={p.id} producto={p}
                  esFav={favoritos.includes(p.id)}
                  onFav={toggleFavorito}
                  onClick={() => abrirDetalle(p)}
                  estrellas={estrellas}
                />
              ))}
            </div>
        }
      </div>
      <BottomNav vista={vista} setVista={setVista} />
    </div>
  );
}

function ProductoCard({ producto, esFav, onFav, onClick, estrellas }) {
  return (
    <div className="producto-card" onClick={onClick}>
      <div className="producto-card-img">
        {producto.imagenURL
          ? <img src={producto.imagenURL} alt={producto.nombre} />
          : <div className="producto-card-noimg">💄</div>
        }
        <button className="btn-fav" onClick={(e) => { e.stopPropagation(); onFav(producto.id); }}>
          {esFav ? "❤️" : "🤍"}
        </button>
        <span className="producto-card-tag">{producto.categoria}</span>
      </div>
      <div className="producto-card-body">
        <p className="producto-marca">{producto.marca}</p>
        <h3>{producto.nombre}</h3>
        <div className="producto-card-meta">
          <span className="estrellas-small">{estrellas(producto.calificacion || 5)}</span>
          {producto.precio && <span className="precio">Q{producto.precio}</span>}
        </div>
      </div>
    </div>
  );
}

function BottomNav({ vista, setVista }) {
  return (
    <nav className="bottom-nav">
      <button className={vista === VISTAS.HOME ? "activo" : ""} onClick={() => setVista(VISTAS.HOME)}>
        <span>🏠</span><small>Inicio</small>
      </button>
      <button className="btn-add-center" onClick={() => setVista(VISTAS.NUEVO)}>
        <span>+</span>
      </button>
      <button className={vista === VISTAS.FAVORITOS ? "activo" : ""} onClick={() => setVista(VISTAS.FAVORITOS)}>
        <span>❤️</span><small>Favoritos</small>
      </button>
    </nav>
  );
}
