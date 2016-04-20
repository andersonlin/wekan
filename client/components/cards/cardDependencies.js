
BlazeComponent.extendComponent({
  openCardDependenciesLists(evt) {
    evt.preventDefault();
    Session.set('cardDependencyType', this.currentData().cardDependencyType);
    Popup.open('cardDependenciesBoards')(evt);
  },

  events() {
    return [{
      'click .js-add-dependency': this.openCardDependenciesLists,
    }];
  },
}).register('addCardDependencies');

BlazeComponent.extendComponent({
  // onCreated() {
  //   this.subscribe('boards');
  // },

  boards() {
    return Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
    }, {
      sort: ['title'],
    });
  },

  events() {
    return [{
      'click .js-select-list': Popup.open('cardDependenciesLists'),
    }];
  },
}).register('boardsByUserId');

BlazeComponent.extendComponent({
  // onCreated() {
  //   this.subscribe('lists');
  // },

  lists() {
    return Boards.findOne(this.currentData().selectedBoard._id).lists().fetch();
  },

  events() {
    return [{
      'click .js-select-list': Popup.open('cardDependenciesCards'),
    }];
  },
}).register('listsByBoardId');

BlazeComponent.extendComponent({
  // onCreated() {
  //   this.subscribe('cards');
  // },

  cards() {
    var _cards = Lists.findOne(this.currentData().selectedList._id).cards().fetch();
    return _cards;
  },

  exists() {
    const cardId = Cards.findOne(Session.get('currentCard'))._id;
    const cardDependencyId = this.currentData()._id;
    return CardDependencies.findOne({
      $or: [
        { cardId: cardId, cardDependencyId: cardDependencyId },
        { cardId: cardDependencyId, cardDependencyId: cardId },
      ],
    });
  },

  events() {
    return [{
      'click .js-select-list'(evt) {
        const card = Cards.findOne(Session.get('currentCard'));
        const cardDependencyType = Session.get('cardDependencyType');
        const existDependency = this.exists();
        if (cardDependencyType === 'depends-on'){
          if (!existDependency){
            if (this.currentData()._id !== card._id) {
              CardDependencies.insert({
                cardId: card._id,
                boardId: card.boardId,
                cardDependencyId: this.currentData()._id,
                isFinished: false,
              });
            }
          } else {
            const dependencyId = existDependency._id;
            CardDependencies.remove(dependencyId);
          }
        }

        if (cardDependencyType === 'depended-by'){
          if (!existDependency){
            if (this.currentData()._id !== card._id) {
              CardDependencies.insert({
                cardId: this.currentData()._id,
                cardDependencyId: card._id,
                boardId: card.boardId,
                isFinished: false,
              });
            }
          } else {
            const dependencyId = existDependency._id;
            CardDependencies.remove(dependencyId);
          }
        }
      },
    }];
  },
}).register('cardsByListId');

BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('boards');
    this.subscribe('lists');
    this.subscribe('cards');
    this.subscribe('cardDependencies');
  },

  toggleSelection(evt){
    evt.stopPropagation();
    evt.preventDefault();
    const isFinished = !this.currentData().isFinished;
    if (isFinished !== null) {
      CardDependencies.update(this.currentData()._id, {
        $set: {
          isFinished,
          finishedAt: new Date(),
        },
      });
    }
  },

  dependencies(cardDependencyType) {
    const card = Cards.findOne(Session.get('currentCard'));
    // let cardDependencyType = this.currentData().cardDependencyType ? this.currentData().cardDependencyType : Session.get('cardDependencyType');
    if (cardDependencyType === 'depends-on'){
      const dependsOnCard = CardDependencies.find({ cardId: card._id }).fetch();
      return _.map(dependsOnCard, (v) => {
        v.card = Cards.findOne({_id: v.cardDependencyId});
        return v;
      });
    } else {
      const dependedByCard = CardDependencies.find({ cardDependencyId: card._id}).fetch();
      return _.map(dependedByCard, (v) => {
        v.card = Cards.findOne({_id: v.cardId});
        return v;
      });
    }
  },

  events() {
    return [{
      'click .js-toggle-multi-selection': this.toggleSelection,
      'click .js-remove-dependency': this.removeDependencyItem,
    }];
  },
}).register('cardDependencyPanel');

BlazeComponent.extendComponent({
  removeDependencyItem() {
    const dependencyId = this.currentData()._id;
    CardDependencies.remove(dependencyId);
  },

  events() {
    return [{
      'click .js-remove-dependency': this.removeDependencyItem,
    }];
  },
}).register('dependencyCard');
