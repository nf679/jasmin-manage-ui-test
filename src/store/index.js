import create from 'zustand';

import { immer } from './utils';
import { newEndpoint, newResource } from './api';


// Export the top-level collections
export const useCurrentUser = create(immer(newEndpoint("/api/me/")));
export const useCategories = create(immer(newResource("/api/categories/")));
export const useConsortia = create(immer(newResource("/api/consortia/")));
export const useProjects = create(immer(newResource("/api/projects/")));
export const useResources = create(immer(newResource("/api/resources/")));
