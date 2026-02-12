'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { useState } from 'react';
interface AuthLayoutProps {
  title: string;
  children: (isOfficial: boolean) => React.ReactNode;
}

export default function AuthLayout({ title, children }: AuthLayoutProps) {
  const [isOfficial, setIsOfficial] = useState<boolean>(false);
  return (
    <div className="login-body">
      <div className="container-fluid h-100">
        <div className="row no-gutter h-100">
          {/* LEFT SIDE */}
          <div className="col-md-6 bg-light">
            <div className="login d-flex align-items-center h-100">
              <div className="container">
                <div className="row">
                  <div className="d-flex justify-content-between align-items-end m-2 px-2">
                    <div className="flex flex-col items-center space-x-3">
                      <img
                        className="box shake-after-10s"
                        width="80"
                        src="/images/login-mithu.png"
                        alt="Mithu"
                      />
                    </div>
                    
                  </div>
                  <div className="col-lg-10 col-xl-7 mx-auto">
                    <div className="flex align-items-center justify-content-center">
                      <h3 className="display-7 text-center my-3 mx-2">
                        {title == 'LOGIN' ? 'Login As' : title}
                      </h3>
                      {title == 'LOGIN' ? (
                        <div className="relative flex items-center rounded-lg border border-success">
                          {/* Sliding active background */}
                          <div
                            className={`absolute top-0 bottom-0 h-100 w-1/2 rounded-md bg-success transition-all duration-300 ease-in-out
                              ${isOfficial ? 'left-1/2' : 'right-1/2'}
                            `}
                          />

                          <button
                            onClick={() => setIsOfficial(false)}
                            className={`relative z-10 w-1/2 text-uppercase py-1 px-3 text-center font-semibold
                              transition-colors duration-300
                              hover:bg-transparent
                              ${isOfficial ? 'text-success' : 'text-white'}
                            `}
                          >
                            Farmer
                          </button>

                          <button
                            onClick={() => setIsOfficial(true)}
                            className={`relative z-10 w-1/2 text-uppercase py-1 px-3 text-center font-semibold
                              transition-colors duration-300
                              hover:bg-transparent
                              ${isOfficial ? 'text-white' : 'text-success'}
                            `}
                          >
                            Official
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {children(isOfficial)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE IMAGE */}
          <div className="col-md-6 d-none d-md-flex bg-image"></div>
        </div>
      </div>

      <footer className="bg-dark login-footer text-white py-2 text-center">
        <p className="m-0">
          Developed and Maintained By
          <span className="px-2 d-inline-block text-white font-bold">
            GenXAI Analytics Pvt Ltd
          </span>
        </p>
      </footer>

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
    </div>
  );
}
