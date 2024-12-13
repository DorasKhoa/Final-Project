import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const MyAppointments = () => {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_');
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2];
  };

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } });
      if (data.success) {
        setAppointments(data.appointments.reverse());
        console.log(data.appointments);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/cancel-appointment',
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const handlePaymentSuccess = async (orderId, appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/complete-payment',
        { appointmentId, orderId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token]);

  return (
    <PayPalScriptProvider
      options={{
        "client-id": "ATYD3pHC_81ULx6JIT76tT8cjB8V4Boa1WEXuYpfwiIPcBpu3orLxncmw-Jbq_wdHFAGFAu-AZ5Ihi3T",
        currency: "USD",
      }}
    >
      <div>
        <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My appointments</p>
        <div>
          {appointments.map((item, index) => (
            <div
              className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b'
              key={index}
            >
              <div>
                <img className='w-32 bg-indigo-50' src={item.docData.image} alt="" />
              </div>
              <div className='flex-1 text-sm text-zinc-600'>
                <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
                <p>{item.docData.speciality}</p>
                <p className='text-zinc-700 font-medium mt-1'>Address:</p>
                <p className='text-xs'>{item.docData.address.line1}</p>
                <p className='text-xs'>{item.docData.address.line2}</p>
                <p className='text-xs mt-1'>
                  <span className='text-sm text-neutral-700 font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} | {item.slotTime}
                </p>
              </div>
              <div className='flex flex-col gap-2 justify-end'>
                {!item.cancelled && !item.isCompleted && (
                  <div>
                    <PayPalButtons
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          purchase_units: [
                            {
                              amount: {
                                value: item.docData.fees.toString(),
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={(data, actions) => {
                        return actions.order.capture().then((details) => {
                          const orderId = details.id;
                          handlePaymentSuccess(orderId, item._id);
                        });
                      }}
                      onError={(err) => {
                        console.error(err);
                        toast.error("Payment failed. Please try again.");
                      }}
                    />
                  </div>
                )}
                {!item.cancelled && !item.isCompleted && (
                  <button
                    onClick={() => cancelAppointment(item._id)}
                    className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'
                  >
                    Cancel appointment
                  </button>
                )}
                {item.cancelled && !item.isCompleted && (
                  <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>
                    Appointment Cancelled
                  </button>
                )}
                {item.isCompleted && (
                  <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>
                    Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default MyAppointments;