// Planning only. This script does not record acceptance or send information.
(() => {
  const planner = document.querySelector('[data-price-planner]');
  const config = document.querySelector('#proposal-pricing');
  if (!planner || !config) return;
  const pricing = JSON.parse(config.textContent);
  const projectSelect = planner.querySelector('#estimate-project');
  const careSelect = planner.querySelector('#estimate-care');
  const summary = planner.querySelector('#estimate-summary');
  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  });
  const money = value => currency.format(value);

  function render() {
    const project = pricing.projects[projectSelect.value];
    const care = pricing.care[careSelect.value];
    summary.replaceChildren();
    const add = message => {
      const paragraph = document.createElement('p');
      paragraph.textContent = message;
      summary.append(paragraph);
    };
    if (!project) {
      add('Choose a project to see the invoice amounts.');
      if (care.months) add(`${care.name}: ${money(care.monthly)}/month, ${money(care.monthly * care.months)} initial commitment, billed monthly from launch.`);
      return;
    }
    const initialInvoice = project.fee / 2;
    const careTotal = care.monthly * care.months;
    add(`${project.name}: ${money(project.fee)} one-time fixed project fee.`);
    add(`Initial project invoice after acceptance: ${money(initialInvoice)} (50%). Work begins after required access, content, and initial payment are received at the agreed kickoff.`);
    add(`Final project invoice at launch: ${money(initialInvoice)} (50%), payable within 15 days.`);
    if (care.months) {
      add(`${care.name}: ${money(care.monthly)}/month from launch. Initial commitment total: ${money(careTotal)}, billed monthly over ${care.months} months.`);
      add(`Project plus initial care commitment: ${money(project.fee + careTotal)}. This is a combined commitment total, not an upfront invoice.`);
      add('Monthly billing does not make the initial care commitment month to month. Any renewal rate must be agreed in writing; 30 days’ notice applies to the renewal arrangement, not early cancellation of the initial term.');
    } else {
      add('No care plan for now. There is no monthly care charge or initial care commitment.');
    }
    add('Planning summary only. This selection does not accept the proposal, collect a signature, or submit information.');
  }
  projectSelect.addEventListener('change', render);
  careSelect.addEventListener('change', render);
  planner.hidden = false;
  render();
})();
