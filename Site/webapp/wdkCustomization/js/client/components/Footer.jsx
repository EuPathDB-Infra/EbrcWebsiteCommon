import React from 'react';
import { connect } from 'react-redux';
import NewWindowLink from './NewWindowLink';
import { formatReleaseDate } from '../util/formatters';

import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import 'ebrc-client/components/homepage/ProjectLink.scss';

const projectLinkCx = makeClassNameHelper('ebrc-ProjectLink');

const projects = [
  'VEuPathDB',
  'AmoebaDB',
  'CryptoDB',
  'FungiDB',
  'GiardiaDB',
  'MicrosporidiaDB',
  'PiroplasmaDB',
  'PlasmoDB',
  'ToxoDB',
  'TrichDB',
  'TriTrypDB',
  'VectorBase',
  'OrthoMCL',
  'ClinEpiDB',
  'MicrobiomeDB'
];

const enhance = connect(state => state.globalData, null)
/** Application footer */
export default enhance(function Footer(props) {
  const {
    siteConfig: { webAppUrl },
    config: { buildNumber, displayName, releaseDate } = {}
  } = props;

  return (
    <div className="Footer">
      <div>
        <div>
          <span>
            <a href={`//${location.hostname}`}>{displayName}</a>
            <span> {buildNumber} &nbsp;&nbsp; {releaseDate && formatReleaseDate(releaseDate)}</span>
          </span>
          <br/>
        </div>
        <div>©{new Date().getFullYear()} The VEuPathDB Project Team</div>
      </div>

      <div>
        <ul className="site-icons">
          {projects.map(project =>
            <React.Fragment key={project}>
              <li title={`${project}.org`} className={projectLinkCx()}>
                <a href={`https://${project.toLowerCase()}.org`} className={project}>
                  https://{project.toLowerCase()}.org
                </a>
              </li>
              {
                project === 'VectorBase' &&
                <li className="divider"></li>
              }
            </React.Fragment>
          )}
        </ul>
      </div>

      <div>
        <div>
          <a href="http://code.google.com/p/strategies-wdk/">
            <img width="120" src={webAppUrl + '/wdk/images/stratWDKlogo.png'} />
          </a>
        </div>
        <div>
          Please <NewWindowLink href={webAppUrl + '/app/contact-us'}>Contact Us</NewWindowLink> with any questions or comments
        </div>
      </div>
    </div>
  );
});
