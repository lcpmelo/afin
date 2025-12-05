/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native'); // Pega o React Native real

  // Sobrescreve apenas o NativeModules
  RN.NativeModules.AudioCapture = {
    ON_FREQUENCY_EVENT: 'onFrequency', // Simula a constante
    start: jest.fn(() => Promise.resolve()), // Simula a função start
    stop: jest.fn(), // Simula a função stop
    setInstrumentMode: jest.fn(), // Simula a função setInstrumentMode
  };

  RN.NativeModules.AudioEmitter = {
    play: jest.fn(),
    stop: jest.fn(),
  };

  return RN;
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
