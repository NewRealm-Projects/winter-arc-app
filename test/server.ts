import { setupServer } from 'msw/node';
import { dashboardHandlers } from './handlers/dashboardHandlers';
import { notesHandlers } from './handlers/notesHandlers';

export const server = setupServer(...dashboardHandlers, ...notesHandlers);
