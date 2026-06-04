import React from 'react';
import { Gift } from 'lucide-react';
import { Client } from '../types';
import { isBirthdayToday } from '../utils/dateUtils';

interface BirthdaysBannerProps {
  clients: Client[];
}

export const BirthdaysBanner: React.FC<BirthdaysBannerProps> = ({ clients }) => {
  const birthdayClients = clients.filter(c => isBirthdayToday(c.childBirthDate));

  if (birthdayClients.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 rounded-xl p-4 mb-6 shadow-sm flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-sm border border-amber-200">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-amber-900 text-sm">Сегодня день рождения!</h3>
          <p className="text-amber-800 text-[11px] font-medium mt-0.5">
            Не забудьте поздравить: {birthdayClients.map(c => `${c.childName} ${c.childSurname} (${c.childAge} лет)`).join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
};
