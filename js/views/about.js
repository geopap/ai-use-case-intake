import { section, pageHead } from '../ui.js';

export function render() {
  return `
    ${pageHead('About this project', 'The front door for AI in the enterprise', 'Most companies now have dozens of AI ideas and no consistent way to decide which to pursue, or what each one needs before it goes live. This tool is that front door: one intake, one assessment, one decision trail.')}
    <div class="grid-2">
      ${section('The problem', `<p>AI ideas arrive from every function: chatbots, scoring models, copilots, vision checks. Without a front door, three things go wrong at once:</p>
        <ul class="checklist"><li><b>Value is unclear.</b> Pilots start without a KPI or a business case, so nobody can say later whether they worked.</li>
        <li><b>Risk is found late.</b> A recruitment tool or a credit model turns out to be high-risk under the EU AI Act after it has been bought or built.</li>
        <li><b>Governance becomes a bottleneck.</b> Every idea gets the same heavy review, so low-risk wins wait as long as the hard cases.</li></ul>`)}
      ${section('The approach', `<ol class="reasoning">
        <li><b>One intake</b> captures what the AI does, for whom, with which data, and what it is worth.</li>
        <li><b>Rule-based classification</b> applies the EU AI Act and GDPR screening and shows the article behind every result.</li>
        <li><b>Proportionate review</b>: a fast track for minimal risk, enhanced review for high-risk, and a stop for prohibited practices.</li>
        <li><b>Controls attached automatically</b> and tracked to completion before launch.</li>
        <li><b>A human decision</b> with a rationale and conditions, logged in a tamper-evident trail.</li>
        <li><b>Hand-over to the portfolio</b>: approved use cases flow into the <a href="https://geopap.github.io/ai-portfolio-office/" target="_blank" rel="noopener">AI Portfolio Office</a>, where their value is tracked.</li></ol>`)}
    </div>
    <div class="grid-2">
      ${section('Where AI helps, and where it does not', `<p>An optional assistant reads a plain-language idea and <b>suggests</b> answers to the screening questions. Each suggestion stays marked until the submitter confirms it. The risk tier is always computed by the rules, and the assistant never estimates money. That is a deliberate design choice: AI speeds up the paperwork, people stay accountable for the judgement.</p>`)}
      ${section('Try it', `<ol class="reasoning">
        <li>Open <a href="#/case?id=UC-05">UC-05 Credit scoring</a>: high-risk, provider obligations, FRIA and Art. 22.</li>
        <li>Compare with <a href="#/case?id=UC-13">UC-13</a>: an Annex III area, but exempted under Art. 6(3).</li>
        <li>See <a href="#/case?id=UC-07">UC-07</a>: emotion recognition at work, a prohibited practice.</li>
        <li>Submit your own idea in <a href="#/intake">New intake</a> and watch the classification change as you answer.</li>
        <li>Approve a use case and send it to the AI Portfolio Office.</li></ol>
        <p class="small muted">All data is synthetic. Varnholt Group is a fictional company. The regulatory mapping is indicative and is not legal advice.</p>`)}
    </div>`;
}
