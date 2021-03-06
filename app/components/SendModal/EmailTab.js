import React, { Fragment } from 'react';
import uuid from 'uuid/v4';
import { arrayOf, bool, func, string } from 'prop-types';
import styles from './EmailTab.scss';

const Input = ({ value, onChange, onKeyDown, error }) => (
  <label
    htmlFor="sendEmailInput"
    className={styles.label}
    style={error ? { borderColor: '#F44336' } : {}}
  >
    <p className={value ? styles.hasValue : ''}>
      Email
      {error ? (
        <span className={styles.error}>
          <i className="fas fa-exclamation-circle" /> {error}
        </span>
      ) : null}
    </p>
    <input
      id="sendEmailInput"
      className={styles.input}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      type="email"
    />
    <i
      className={`fas fa-envelope ${styles.mailIcon}`}
      style={error ? { color: 'rgba(244, 67, 54, 0.6)' } : {}}
    />
  </label>
);

Input.propTypes = {
  value: string.isRequired,
  onChange: func.isRequired,
  onKeyDown: func.isRequired,
  error: string.isRequired
};

const RecentEmailRow = ({ email, addEmail, isAdded }) => (
  <div className={`${styles.row} ${styles.recentRow}`}>
    <p>{email}</p>
    <button
      type="button"
      className={`${styles.add} ${isAdded ? styles.disabled : ''}`}
      onClick={addEmail}
    >
      Add
    </button>
  </div>
);

RecentEmailRow.propTypes = {
  email: string.isRequired,
  addEmail: func.isRequired,
  isAdded: bool.isRequired
};

const EmailRow = ({ email, removeEmail }) => (
  <div className={styles.row}>
    <p>{email}</p>
    <button
      type="button"
      className={styles.remove}
      onClick={removeEmail(email)}
    >
      <i className="fa fa-times" />
    </button>
  </div>
);

EmailRow.propTypes = {
  email: string.isRequired,
  removeEmail: func.isRequired
};

const EmailTab = ({
  currentEmail,
  emails,
  handleEmailChange,
  handleKeyDown,
  removeEmail,
  error,
  recentEmails,
  addEmail
}) => {
  const renderEmails = () =>
    emails.map((email, index) => (
      <Fragment key={uuid()}>
        <EmailRow email={email} removeEmail={removeEmail} />
        {index !== emails.length - 1 ? (
          <div className={styles.divider} />
        ) : null}
      </Fragment>
    ));

  const renderRecentEmails = () =>
    recentEmails.map(email => {
      const isAdded = emails.indexOf(email) > -1;
      return (
        <RecentEmailRow
          key={uuid()}
          email={email}
          addEmail={addEmail(email)}
          isAdded={isAdded}
        />
      );
    });

  return (
    <div className={styles.emailContainer}>
      <Input
        value={currentEmail}
        onChange={handleEmailChange}
        onKeyDown={handleKeyDown}
        error={error}
      />
      <div className={styles.lists}>
        <div className={styles.emails}>{renderEmails()}</div>
        {recentEmails.length ? (
          <div className={styles.recentEmails}>
            <div className={styles.recentDivider} />
            <p className={styles.recentTitle}>Recently Sent To:</p>
            {renderRecentEmails()}
          </div>
        ) : null}
      </div>
    </div>
  );
};

EmailTab.propTypes = {
  currentEmail: string,
  emails: arrayOf(string),
  error: string,
  handleEmailChange: func.isRequired,
  handleKeyDown: func.isRequired,
  removeEmail: func.isRequired,
  addEmail: func.isRequired,
  recentEmails: arrayOf(string)
};

EmailTab.defaultProps = {
  currentEmail: '',
  emails: [],
  recentEmails: [],
  error: ''
};

export default EmailTab;
