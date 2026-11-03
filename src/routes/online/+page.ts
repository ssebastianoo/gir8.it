import { redirect } from '@sveltejs/kit';

// old links, the contact details used to live on their own page
export const load = () => redirect(308, '/#connect');
