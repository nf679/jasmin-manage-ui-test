import create from 'zustand';

import { immer } from './utils';
import { newEndpoint, newResource } from './api';


// Export the top-level collections
export const useCurrentUser = create(immer(newEndpoint("/me/")));
export const useCategories = create(immer(newResource("/categories/")));
export const useConsortia = create(immer(newResource("/consortia/")));
export const useProjects = create(immer(newResource("/projects/")));
export const useResources = create(immer(newResource("/resources/")));
