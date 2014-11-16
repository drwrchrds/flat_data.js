function DashboardUI() {
  this.dashboard = new Dashboard(inventory, details, rawData);
  this.bindClickEvents();
  
  showSoldCount.click();
  showCombined.click();
}



DashboardUI.prototype.bindClickEvents = function () {
  function updateButtons(button) {
    // using jquery b/c #parents method is awesome
    var $set = $(button).parents('.button-set');
    var $otherButtons = $set.find('button');
    $otherButtons.removeClass('selected');
  
    button.classList.add('selected');
  }

  var dashboard = this.dashboard;
  showFlowers.onclick = function () {
    dashboard.updateView({ showCombined: false });
    updateButtons(this);
    return false;
  };

  showCombined.onclick = function () {
    dashboard.updateView({ showCombined: true });
    updateButtons(this);
    return false;
  };

  showReceivedCount.onclick = function () {
    dashboard.updateView({
      property: 'received',
      showPercent: false
    });
    updateButtons(this);
    return false;
  };

  showReceivedPercent.onclick = function () {
    dashboard.updateView({
      property: 'received',
      showPercent: true
    });
    updateButtons(this);
    return false;
  };

  showSoldCount.onclick = function () {
    dashboard.updateView({ 
      property: 'sold',
      showPercent: false
    });
    updateButtons(this);
    return false;
  };

  showSoldPercent.onclick = function () {
    dashboard.updateView({ 
      property: 'sold',
      showPercent: true
    });
    updateButtons(this);
    return false;
  };

  showRemainingCount.onclick = function () {
    dashboard.updateView({ 
      property: 'remaining',
      showPercent: false 
    });
    updateButtons(this);
    return false;
  };

  showRemainingPercent.onclick = function () {
    dashboard.updateView({ 
      property: 'remaining',
      showPercent: true
    });
    updateButtons(this);
    return false;
  };
};