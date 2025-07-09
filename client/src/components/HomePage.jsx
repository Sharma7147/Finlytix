import { FaChartPie, FaBell, FaMobileAlt, FaShieldAlt, FaSyncAlt } from 'react-icons/fa';
import { FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    // Update login state
    setIsLoggedIn(false);
    // Redirect to home
    navigate('/');
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const slideUp = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center"
            >
              <div className="flex-shrink-0 flex items-center">
                <span className="text-indigo-700 font-bold text-xl">Fin</span>
                <span className="text-blue-400 font-bold text-xl">Lytix</span>
              </div>
            </motion.div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <motion.a 
                  whileHover={{ scale: 1.05, color: "#4F46E5" }}
                  href="#features" 
                  className="text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  Features
                </motion.a>
                <motion.a 
                  whileHover={{ scale: 1.05, color: "#4F46E5" }}
                  href="#how-it-works" 
                  className="text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  How It Works
                </motion.a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGetStarted}
                    className="text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors"
                  >
                    Dashboard
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogin}
                    className="text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors"
                  >
                    Login
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRegister}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Register
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      

      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 lg:mt-16 lg:px-8 xl:mt-20">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={slideUp}
                className="sm:text-center lg:text-left"
              >
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Take Control of Your</span>
                  <span className="block text-indigo-600">Finances Today</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  The simplest way to track expenses, set budgets, and achieve your financial goals.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGetStarted}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                  >
                    Get Started
                  </motion.button>
                </div>
              </motion.div>
            </main>
          </div>
        </div>
        <motion.div 
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2"
        >
          <img 
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full" 
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
            alt="Dashboard preview" 
          />
        </motion.div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="lg:text-center"
          >
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage expenses
            </p>
          </motion.div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { 
                  title: "Visual Analytics", 
                  description: "Beautiful charts to visualize your spending patterns and identify saving opportunities.",
                  icon: <FaChartPie className="h-6 w-6" />,
                  color: "indigo"
                },
                { 
                  title: "Smart Alerts", 
                  description: "Get notified when you're approaching budget limits.",
                  icon: <FaBell className="h-6 w-6" />,
                  color: "blue"
                },
                { 
                  title: "Mobile Friendly", 
                  description: "Track expenses on the go with our mobile interface.",
                  icon: <FaMobileAlt className="h-6 w-6" />,
                  color: "green"
                },
                { 
                  title: "Bank-Level Security", 
                  description: "Your data is encrypted with highest security standards.",
                  icon: <FaShieldAlt className="h-6 w-6" />,
                  color: "purple"
                },
                { 
                  title: "Automatic Sync", 
                  description: "Connect bank accounts for real-time updates.",
                  icon: <FaSyncAlt className="h-6 w-6" />,
                  color: "yellow"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  animate="visible"
                  variants={slideUp}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`group relative bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100`}
                >
                  <div>
                    <span className={`rounded-lg inline-flex p-3 bg-${feature.color}-50 text-${feature.color}-600 ring-4 ring-white`}>
                      {feature.icon}
                    </span>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                  <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-indigo-400 transition-colors">
                    <FiArrowRight className="h-6 w-6" />
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={slideUp}
            className="lg:w-2/3"
          >
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to take control of your finances?</span>
            </h2>
            <p className="mt-3 max-w-3xl text-lg leading-6 text-indigo-100">
              Start tracking your expenses today.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={slideUp}
            transition={{ delay: 0.2 }}
            className="mt-8 flex lg:mt-0 lg:flex-shrink-0"
          >
            <div className="inline-flex rounded-md shadow">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                Get started
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Product</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#features" className="text-base text-gray-300 hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="text-base text-gray-300 hover:text-white">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-300 hover:text-white">About</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; {new Date().getFullYear()} FinLytix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}