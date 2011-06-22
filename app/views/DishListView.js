Ext.regModel('DishItem', {
    fields: ['name', 'resName','distance','icon']
});

var store = new Ext.data.JsonStore({
    model  : 'DishItem',
    data: [
        {name: 'Tea Leaf Salad',   resName: 'Burma Superstar', distance: '55' , icon: 'salad.jpg'},
		{name: 'Salted Caramel Ice Cream',   resName: 'Birite Creamy', distance: '206' , icon: 'icecream.jpg'},
		{name: 'Tea Leaf Salad',   resName: 'Burma Superstar', distance: '268' , icon: 'salad.jpg'},
		{name: 'Tea Leaf Salad',   resName: 'Burma Superstar', distance: '55' , icon: 'salad.jpg'},
		{name: 'Salted Caramel Ice Cream',   resName: 'Birite Creamy', distance: '206' , icon: 'icecream.jpg'},
		{name: 'Tea Leaf Salad',   resName: 'Burma Superstar', distance: '268' , icon: 'salad.jpg'},
		{name: 'Cream Ice',   resName: 'Burma Superstar', distance: '301' , icon: 'icecream.jpg'}
    ]
});
var dishesBtn = new Ext.Button({
	text: 'Dishes',
	iconMask: true,
	iconCls: 'dishes',
	ui: 'decline',
	width : "40%",
	handler : function(b,e) {
			Ext.dispatch({
				controller: Crave.controllers.nearby,
				action    : 'showDishes',
				animation: {type:'slide', direction:'left'}
			});
	}
});
var resBtn = new Ext.Button({
	text: 'Restaurents',
	iconMask: true,
	iconCls: 'res',
	ui: 'decline',
	width : "40%",
	handler : function(b,e) {
			Ext.dispatch({
				controller: Crave.controllers.nearby,
				action    : 'showRes',
				animation: {type:'slide', direction:'left'}
			});
		//this.setActiveitem(Crave.views.reslistcard, {type: 'slide',direction: 'left'});
	}
});
var uBtn = new Ext.Button({
	iconMask: true,
	iconCls: 'filter',
	ui: 'decline',
	width : "20%"
});
var nearByToolbar = new Ext.Toolbar({
	dock :'top',
	ui : 'light',
	padding : 5,
	items:[dishesBtn,resBtn,uBtn]
});
var nearBySearchToolbar = new Ext.Toolbar({
	dock : 'top',
	items: [{
		xtype: 'searchfield',
        name: 'searchBox',
		width : '100%'
	}]
});
var dishList = new Ext.List({
	
	sorters: 'distance',
    itemTpl : '<div class="iconHolder"><img src="{icon}" height="80" width="80"/></div><div class="dishInfo"><div class="dishName">{name}</div><div class="resName">@{resName}</div><div class="resName">{distance} feet away</div></div>',
    store: store,
	 onItemDisclosure: function(record, btn, index) {
			Ext.dispatch({
				controller: Crave.controllers.nearby,
				action    : 'showDish',
				animation: {type:'slide', direction:'left'}
			});
     }
});
Crave.views.DishListView = Ext.extend(Ext.Panel, {
	dockedItems :[nearByToolbar,nearBySearchToolbar],
	items: [dishList]
});
Ext.reg('dishlistcard', Crave.views.DishListView);