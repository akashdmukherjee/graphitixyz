import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Question from '../Question';

const propTypes = {
  assetId: PropTypes.string,
  orgId: PropTypes.string,
  memberId: PropTypes.string,
  faqs: PropTypes.arrayOf(PropTypes.object),
  addFAQ: PropTypes.func.isRequired,
};
const defaultProps = {
  faqs: [],
  assetId: '',
  memberId: '',
  orgId: '',
};

class Faq extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    this.state = {
      faqs: props.faqs,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { faqs } = nextProps;
    if (faqs !== this.props.faqs) {
      this.setState({ faqs });
    }
  }

  handleInputChange = event => {
    const targetName = event.target.name;
    const targetValue = event.target.value;
    this.setState({ [targetName]: targetValue }, () => {
      // console.info(this.state);
    });
  };

  onAddFAQ = () => {
    const { faqs, question, answer } = this.state;
    const { memberId, assetId, orgId, addFAQ } = this.props;
    const newFaqs = [
      {
        question,
        answer,
      },
      ...faqs,
    ];

    // call network api
    addFAQ({
      memberId,
      assetId,
      orgId,
      question,
      answer,
    });

    this.setState({
      faqs: newFaqs,
      question: '',
      answer: '',
    });
  };

  renderFAQs = () => {
    const { faqs } = this.state;

    return faqs.map(faq => (
      <Question key={faq.question} text={faq.question} answer={faq.answer} />
    ));
  };

  render() {
    const { question, answer } = this.state;
    return (
      <div styleName="faq-modal-wrapper">
        <div styleName="faq-editables">
          <div>
            <h5>Question:</h5>
            <textarea
              styleName="question-input"
              rows="2"
              name="question"
              value={question}
              onChange={this.handleInputChange}
            />
          </div>
          <div>
            <h5>Answer:</h5>
            <textarea
              styleName="answer-input"
              rows="2"
              name="answer"
              value={answer}
              onChange={this.handleInputChange}
            />
          </div>
          <div styleName="add-btn-wrapper">
            <button onClick={this.onAddFAQ}>Add FAQ</button>
          </div>
        </div>
        <div styleName="faqs">
          {this.renderFAQs()}
        </div>
      </div>
    );
  }
}

export default cssModules(Faq, styles);
