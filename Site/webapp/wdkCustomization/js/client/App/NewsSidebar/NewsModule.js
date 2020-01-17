import { communitySite, projectId } from 'ebrc-client/config';

const NEWS_LOADING = 'news/loading';
const NEWS_RECEIVED = 'news/received';
const NEWS_ERROR = 'news/error';

export function requestNews() {
  return function run() {
    return [
      { type: NEWS_LOADING },
      fetch(`${communitySite}/${projectId}/news.json`, { mode: 'cors' })
        .then(res => res.text())
        .then(text => text.replace(/,(?=[^,]*$)/, ''))
        .then(JSON.parse)
        // FIXME: Once the trailing comma is removed from the Jekyll response,
        // replace the three ".then"s aboves with this ".then": 
        // .then(res=> res.json())
        .then(
          news => ({ type: NEWS_RECEIVED, payload: { news } }),
          error => ({ type: NEWS_ERROR, payload: { error: error.message } })
        )
    ];
  }
}

const defaultState = {
  status: 'idle',
  news: null,
  error: null,
}

export function newsReducer (state = defaultState, action) {
  switch(action.type) {
    case NEWS_LOADING: return ({ ...state, status: 'loading' });
    case NEWS_RECEIVED: return ({ status: 'idle', error: null, news: action.payload.news });
    case NEWS_ERROR: return ({ status: 'idle', error: action.payload.error, news: state.news });
    default: return state;
  }
}
