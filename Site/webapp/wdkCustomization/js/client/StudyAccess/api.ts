import {
  ApiRequestHandler,
  createFetchApiRequestHandler,
  createJsonRequest,
  standardTransformer
} from 'ebrc-client/util/api';
import {
  NewStaffRequest,
  StaffList,
  StaffPatch,
  newStaffResponse,
  staffList
} from 'ebrc-client/StudyAccess/Types';

const STAFF_PATH = '/staff';
const PROVIDERS_PATH = '/dataset-providers';
const END_USERS_PATH = '/dataset-end-users';

export function createStudyAccessRequestHandler(
  baseStudyAccessUrl: string,
  fetchApi?: Window['fetch']
) {
  // FIXME: DRY this up
  const wdkCheckAuth = document.cookie.split('; ').find(x => x.startsWith('wdk_check_auth=')) ?? '';
  const authKey = wdkCheckAuth.replace('wdk_check_auth=', '');

  return createFetchApiRequestHandler({
    baseUrl: baseStudyAccessUrl,
    init: {
      headers: {
        'Auth-Key': authKey
      }
    },
    fetchApi
  });
}

export function fetchStaffList(handler: ApiRequestHandler): Promise<StaffList> {
  return handler({
    path: STAFF_PATH,
    method: 'GET',
    transformResponse: standardTransformer(staffList)
  });
}

export function newStaffEntry(
  handler: ApiRequestHandler,
  requestBody: NewStaffRequest
) {
  const request = createJsonRequest({
    path: STAFF_PATH,
    method: 'POST',
    body: requestBody,
    transformResponse: standardTransformer(newStaffResponse)
  });

  return handler(request);
}

export function updateStaffEntry(
  handler: ApiRequestHandler,
  staffId: number,
  requestBody: StaffPatch
) {
  const request = createJsonRequest({
    path: `${STAFF_PATH}/${staffId}`,
    method: 'PATCH',
    body: requestBody,
    transformResponse: noContent
  });

  return handler(request);
}

export function deleteStaffEntry(
  handler: ApiRequestHandler,
  staffId: number
) {
  return handler({
    path: `${STAFF_PATH}/${staffId}`,
    method: 'DELETE',
    transformResponse: noContent
  });
}

async function noContent(body: unknown) {
  return null;
}
