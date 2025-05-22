import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail, MapPin, Phone } from 'lucide-react';

const About = () => {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <header className="bg-gray-900 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-lg font-bold">LIEBEFELD</Link>
          <nav>
            <ul className="flex space-x-4">
              <li><Link to="/" className="hover:text-gray-300">Home</Link></li>
              <li><Link to="/chat" className="hover:text-gray-300">Chat</Link></li>
              <li><Link to="/about" className="hover:text-gray-300">Über uns</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 flex-grow">
        <section className="mb-12">
          <h1 className="text-4xl font-bold mb-6">Über uns</h1>
          <p className="text-gray-400 leading-relaxed">
            Willkommen bei Liebefeld, deiner Plattform, um das pulsierende Leben in deiner Stadt zu entdecken und mitzugestalten.
            Wir verbinden Menschen mit gemeinsamen Interessen und schaffen unvergessliche Erlebnisse.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Unser Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-900 rounded-lg p-6">
              <img src="https://via.placeholder.com/150" alt="Teammitglied" className="rounded-full w-24 h-24 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Max Mustermann</h3>
              <p className="text-gray-400">Gründer & CEO</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <img src="https://via.placeholder.com/150" alt="Teammitglied" className="rounded-full w-24 h-24 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Erika Musterfrau</h3>
              <p className="text-gray-400">Marketing Manager</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <img src="https://via.placeholder.com/150" alt="Teammitglied" className="rounded-full w-24 h-24 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Hans Peter</h3>
              <p className="text-gray-400">Tech Lead</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Unsere Vision</h2>
          <p className="text-gray-400 leading-relaxed">
            Wir glauben daran, dass das Leben in der Stadt durch gemeinsame Erlebnisse reicher wird.
            Unsere Plattform soll es jedem ermöglichen, unkompliziert Events zu finden, neue Leute kennenzulernen und die eigene Stadt neu zu entdecken.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Kontakt</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <MapPin className="h-5 w-5 text-gray-400" />
              <p className="text-gray-400">Musterstrasse 123, 8000 Zürich</p>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 text-gray-400" />
              <p className="text-gray-400">info@liebefeld.ch</p>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="h-5 w-5 text-gray-400" />
              <p className="text-gray-400">+41 44 123 45 67</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 p-6">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} Liebefeld. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
