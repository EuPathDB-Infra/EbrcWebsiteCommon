import React from 'react';
import PropTypes from 'prop-types';

import { getPolicyUrl, isActionStrict, getRestrictionMessage, actionRequiresApproval } from 'ebrc-client/App/DataRestriction/DataRestrictionUtils';
import Modal from 'ebrc-client/App/Modal';
import { IconAlt as Icon } from 'wdk-client/Components';
import { safeHtml } from 'wdk-client/Utils/ComponentUtils';

import './DataRestrictionModal.scss';

class DataRestrictionModal extends React.Component {
  constructor (props) {
    super(props);
    this.renderRestrictionMessage = this.renderRestrictionMessage.bind(this);
    this.renderPolicyNotice = this.renderPolicyNotice.bind(this);
    this.renderButtons = this.renderButtons.bind(this);
  }

  renderRestrictionMessage () {
    const { study, action, webAppUrl } = this.props;
    const message = getRestrictionMessage({ study, action });
    const studyPageUrl = webAppUrl + '/app' + study.route;
    return (study.access === 'noaccessreq') 
      ? (
        <div>
          <h2>The {safeHtml(study.name)} study is not yet publicly available.</h2>
          <hr />
          <p>Please see the <a href={studyPageUrl}>{safeHtml(study.name)} study page</a> to learn more about the study and how to request access to the data.</p>
        </div>
        ) 
      : (
        <div>
          <h2>The {safeHtml(study.name)} study has data access restrictions.</h2>
          <hr />
          <p>{message}</p>
        </div>
        );
  }

  renderPolicyNotice () {
    const { study, webAppUrl } = this.props;
    const policyUrl = getPolicyUrl(study, webAppUrl);
    return (study.access === 'noaccessreq')
      ? null
      : !policyUrl
        ? null
        : (
          <p>
            The data from this study requires approval to download and use in research projects.
            Please read the <a href={policyUrl} target="_blank">{safeHtml(study.name)} Data Access and Use Policy.</a>
          </p>
    );
  }

  renderButtons () {
    const { action, study, user, showLoginForm, onClose, webAppUrl } = this.props;
    const strict = isActionStrict(action);
    const approvalRequired = actionRequiresApproval({ action, study });
    return (study.access === 'noaccessreq') 
      ? (
        <div className="DataRestrictionModal-Buttons">
          {!strict
          ? (
            <button className="btn" onClick={onClose}>
              Dismiss
              <Icon fa="times right-side" />
            </button>
          )
          : (
            <a href="/" title="Go Home">
              <button className="btn">
                Return to Home Page
                <Icon fa="home right-side" />
              </button>
            </a>
            )
          }
        </div>
        ) 
      : (
        <div className="DataRestrictionModal-Buttons">
          {!user.isGuest ? null : (
            <button onClick={() => showLoginForm(window.location.href)} className="btn">
              Log In
              <Icon fa="sign-in right-side" />
            </button>
          )}
        {!approvalRequired ? null : (
          <button onClick={() => {
            const loggedInUrl = `${webAppUrl}/app/request-access/${study.id}?redirectUrl=${encodeURIComponent(window.location.href)}`;

            if (user.isGuest) {
              showLoginForm(loggedInUrl);
            } else {
              window.location.assign(loggedInUrl);
            }
          }} className="btn">
            Submit Data Access Request
            <Icon fa="envelope-open-o right-side" />
          </button>
        )}
        {!strict
          ? (
            <button className="btn" onClick={onClose}>
              Dismiss
              <Icon fa="times right-side" />
            </button>
          )
          : (
            <a href="/" title="Go Home">
              <button className="btn">
                Return to Home Page
                <Icon fa="home right-side" />
              </button>
            </a>
          )
        }
      </div>
    )
  }

  render () {
    const { when, study, action } = this.props;

    const PolicyNotice = this.renderPolicyNotice;
    const Message = this.renderRestrictionMessage;
    const Buttons = this.renderButtons;

    const modalProps = {
      when,
      className: 'DataRestrictionModal',
      wrapperClassName: isActionStrict(action) ? 'DataRestrictionModal-Wrapper' : ''
    };

    return !study ? null : (
      <Modal {...modalProps}>
        <Message/>
        <PolicyNotice/>
        <Buttons/>
      </Modal>
    );
  }
};

DataRestrictionModal.propTypes = {
  user: PropTypes.object.isRequired,
  study: PropTypes.object.isRequired,
  action: PropTypes.string.isRequired,
  when: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  showLoginForm: PropTypes.func.isRequired,
  webAppUrl: PropTypes.string.isRequired
};

export default DataRestrictionModal;
