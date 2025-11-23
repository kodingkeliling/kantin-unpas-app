import { Kantin } from '@/types';

export const mockKantins: Kantin[] = [
  {
    id: 'kantin-1',
    name: 'Kantin Utama',
    description: 'Kantin utama dengan berbagai menu lengkap',
    image: '/kantin-1.jpg',
    ownerId: 'owner-1',
    menus: [
      {
        id: 'menu-1',
        name: 'Nasi Goreng Spesial',
        description: 'Nasi goreng dengan telur, ayam, dan kerupuk',
        price: 15000,
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
        available: true,
      },
      {
        id: 'menu-2',
        name: 'Mie Ayam',
        description: 'Mie ayam dengan pangsit dan bakso',
        price: 12000,
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop',
        available: true,
      },
      {
        id: 'menu-3',
        name: 'Gado-gado',
        description: 'Sayuran segar dengan bumbu kacang',
        price: 10000,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        available: true,
      },
    ],
  },
  {
    id: 'kantin-2',
    name: 'Kantin Barat',
    description: 'Menu barat dan minuman',
    image: '/kantin-2.jpg',
    ownerId: 'owner-2',
    menus: [
      {
        id: 'menu-4',
        name: 'Burger Spesial',
        description: 'Burger dengan daging, keju, dan sayuran',
        price: 20000,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
        available: true,
      },
      {
        id: 'menu-5',
        name: 'Kentang Goreng',
        description: 'Kentang goreng crispy',
        price: 8000,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
        available: true,
      },
      {
        id: 'menu-6',
        name: 'Es Jeruk',
        description: 'Es jeruk peras segar',
        price: 5000,
        image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop',
        available: true,
      },
    ],
  },
  {
    id: 'kantin-3',
    name: 'Kantin Timur',
    description: 'Menu tradisional dan jajanan',
    image: '/kantin-3.jpg',
    ownerId: 'owner-3',
    menus: [
      {
        id: 'menu-7',
        name: 'Bakso Malang',
        description: 'Bakso dengan mie dan tahu',
        price: 13000,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
        available: true,
      },
      {
        id: 'menu-8',
        name: 'Sate Ayam',
        description: 'Sate ayam dengan bumbu kacang',
        price: 15000,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
        available: true,
      },
    ],
  },
];

export const getKantinById = (id: string): Kantin | undefined => {
  return mockKantins.find((k) => k.id === id);
};

