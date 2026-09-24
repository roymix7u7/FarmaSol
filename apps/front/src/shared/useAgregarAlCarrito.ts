import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { carritoApi } from '../api/carrito';
import { mensajeDeError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Producto } from '../types';

/**
 * Agregar al carrito desde cualquier listado de productos: manda a login si no
 * hay sesión, bloquea al personal y avisa con un toast.
 */
export function useAgregarAlCarrito() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  function mostrarToast(mensaje: string) {
    setToast(mensaje);
    setTimeout(() => setToast(''), 2200);
  }

  async function agregar(producto: Producto) {
    setError('');
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.tipo !== 'CLIENTE') {
      setError('Solo los clientes pueden comprar');
      return;
    }
    try {
      await carritoApi.agregar(producto.id, 1);
      mostrarToast(`✓ ${producto.nombre} agregado al carrito`);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo agregar al carrito'));
    }
  }

  return { agregar, error, setError, toast };
}
