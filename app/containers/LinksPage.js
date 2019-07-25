import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { arrayOf, bool, func } from 'prop-types';
import { linkShape } from '../shapes';

import { fetchLinksIfNeeded, deleteLink } from '../actions/link';

import Links from '../components/Links';
import Loader from '../components/Loader';

const mapStateToProps = ({ link: { links, isFetching } }) => ({
  links,
  isFetching
});

const mapDispatchToProps = dispatch => ({
  fetchLinks: () => dispatch(fetchLinksIfNeeded()),
  removeLink: (id, index, s3Filename) =>
    dispatch(deleteLink(id, index, s3Filename))
});

const LinksPage = ({ links, fetchLinks, isFetching, removeLink }) => {
  useEffect(() => {
    fetchLinks();
  }, []);

  return isFetching ? (
    <Loader />
  ) : (
    <Links links={links} removeLink={removeLink} />
  );
};

LinksPage.propTypes = {
  isFetching: bool.isRequired,
  links: arrayOf(linkShape),
  fetchLinks: func.isRequired,
  removeLink: func.isRequired
};

LinksPage.defaultProps = {
  links: []
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinksPage);