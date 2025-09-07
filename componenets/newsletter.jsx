import React, { useState } from 'react';

export default function App() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || isSubmitting) {
      setMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    setTimeout(() => {
      setMessage('Subscription successful! Thank you for joining our community.');
      setEmail('');
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="relative isolate overflow-hidden bg-gray-900 py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Centering container */}
        <div className="flex flex-col items-center text-center gap-8 lg:gap-12">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-semibold tracking-tight text-white">
              Join Our  Community
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Get the latest updates on our new arrivals, special offers, and styling tips
              for men's, women's, and kids' apparel, plus our luxurious shawls and bed sheets.
            </p>
          </div>

          {/* Centered form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-4 w-full max-w-md"
          >
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500 sm:text-sm"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          {message && (
            <p
              className={`mt-4 text-sm font-semibold ${
                message.includes('successful') ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl xl:-top-6"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="aspect-1155/678 w-[288.75rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
        />
      </div>
    </div>
  );
}
