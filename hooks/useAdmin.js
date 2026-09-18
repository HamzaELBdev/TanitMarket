"use client";
import { useState, useEffect } from 'react';
import { 
  subscribeAdminListings, 
  updateListingStatusInDb, 
  deleteListingFromDb,
  setHeroFeaturedListingInDb 
} from '@/lib/services/listingsService';
import { 
  subscribeAdminUsers, 
  updateUserStatusInDb, 
  updateUserRoleInDb 
} from '@/lib/services/authService';
import { fetchAdminMetricsFromDb } from '@/lib/firestoreService';

export function useAdmin() {
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubListings = subscribeAdminListings((items) => {
      setListings(items);
      setLoading(false);
    });

    const unsubUsers = subscribeAdminUsers((items) => {
      setUsers(items);
    });

    fetchAdminMetricsFromDb().then(setMetrics);

    return () => {
      if (typeof unsubListings === 'function') unsubListings();
      if (typeof unsubUsers === 'function') unsubUsers();
    };
  }, []);

  const approveListing = async (id) => {
    await updateListingStatusInDb(id, 'Approuvée');
  };

  const rejectListing = async (id) => {
    await updateListingStatusInDb(id, 'Rejetée');
  };

  const deleteListing = async (id) => {
    await deleteListingFromDb(id);
  };

  const setHeroListing = async (id) => {
    await setHeroFeaturedListingInDb(id);
  };

  const updateUserStatus = async (id, status) => {
    await updateUserStatusInDb(id, status);
  };

  const updateUserRole = async (id, role) => {
    await updateUserRoleInDb(id, role);
  };

  const pendingListings = listings.filter(l => l.status === 'pending' || l.status === 'En attente');
  const approvedListings = listings.filter(l => l.status === 'Approuvée' || l.status === 'approved');

  return {
    listings,
    pendingListings,
    approvedListings,
    users,
    metrics,
    loading,
    approveListing,
    rejectListing,
    deleteListing,
    setHeroListing,
    updateUserStatus,
    updateUserRole
  };
}
