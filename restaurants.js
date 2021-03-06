restaurantTemplate = new Ext.XTemplate('<tpl for="."><div class="adish"><img src="../images/no-image-default.png" class="dishImg"><div class="dishListinfo"><span class="dishname">{name}</span><span class="distanceFigure">{[this.distDisplay(values.distance)]}</span></div><span class="chevrony"></span></span></div></tpl>',
    {distDisplay: function(miles) {
        feet = Math.round(miles * 5280);
        if(feet<1000) {
            return feet+" feet";
        } else {
            return parseFloat(miles).toFixed(1)+' miles';
        }
    }});

restaurantDishTemplate = new Ext.XTemplate.from('restDishTemplate');

Ext.regModel('RestaurantDish',
{
    fields: ['name','id','price','description','restaurant_id','restaurant','distance','menu_item_avg_rating_count','avg_rating','count',{
        name: 'rating',
        convert: function(value, record) {
            if(record.get('menu_item_avg_rating_count').avg_rating) {
                return record.get('menu_item_avg_rating_count').avg_rating.toString();
            } else {
                return "unrated";
            }
        }
    },{
        name: 'rating_count',
        convert: function(value, record) {
            if(record.get('menu_item_avg_rating_count').count) {
                if(record.get('menu_item_avg_rating_count').count.toString()=="1") {
                    return record.get('menu_item_avg_rating_count').count.toString()+" review";
                } else {
                    return record.get('menu_item_avg_rating_count').count.toString()+" reviews";
                }
            } else {
                return "";
            }
        }
    },{
        name: 'restaurant_name',
        convert: function(value, record) {
            return record.get('restaurant').name.toString();
        }
    }]
});

Ext.regModel('Restaurants',
{
    fields: ['distance','name','id']
});

Ext.regModel('DishSearch',
{
    fields: ['name','id','price','description','restaurant_id']
});

var places = new Ext.data.Store({
   model: 'Restaurants',
    id: 'places',

   proxy: {
       type:'ajax',
       url:'',
       reader: {
           type:'json',
           record:'restaurant'
       }
   }
});

var singleRestaurantStore = new Ext.data.Store({
    model: 'RestaurantDish',
    sorters: [{property: 'arating', direction: 'ASC'}],
    getGroupString : function(record) {
        rating = parseInt(record.get('rating'));
        if(rating==5) {
            return "<img src='../images/rating-stars/rating-dish-5.png'>";
        }
        if(rating==4) {
            return "<img src='../images/rating-stars/rating-dish-4.png'>";
        }
        if(rating==3) {
            return "<img src='../images/rating-stars/rating-dish-3.png'>";
        }
        if(rating==2) {
            return "<img src='../images/rating-stars/rating-dish-2.png'>";
        }
        if(rating==1) {
            return "<img src='../images/rating-stars/rating-dish-1.png'>";
        } else {
            return "unrated";
        }
    },
    proxy: {
        type:'ajax',
        url:'',
       reader: {
           type:'json',
           record:'menu_item'
       }
    }
});

function placeDisplay(record, index) {
    console.log(urlPrefix+'/places/'+record.data.id+'/items.json');
    singleRestaurantStore.proxy.url = (urlPrefix+'/places/'+record.data.id+'/items.json');

    console.log('set to 4');
    Ext.getCmp('mainPnl').setActiveItem(4);
    singleRestaurantStore.load(function(){
        console.log('store loaded');
        totalRatings = 0;
        singleRestaurantStore.each(function() {
           console.log(this.data.rating_count);
           ratings = this.data.rating_count;
           if(ratings!="") {
               additionValue = parseInt(this.data.rating_count.toString().replace(" reviews",""));
               console.log(additionValue);
               totalRatings = totalRatings + additionValue;
           }
        });
        $("#restaurantTotalRatings").html(totalRatings);
    });

    Ext.Ajax.request({
        url: (urlPrefix+'/places/'+record.data.id+'/details.json'),
        reader: {
             type: 'json'
        },
        success: function(response) {
             //try looping through single restaurant store here
             //populate top panel with restaurant data, map
             var responseObject = eval('(' + response.responseText + ')');
            //set restaurant data locally now
             localStorage.setItem('editRestaurantId',responseObject.restaurant.id);
             htmlString = '<div class="restaurantInfo"><span class="restName">'+responseObject.restaurant.name+'</span><span class="restAddress">'+responseObject.restaurant.street_address+', '+responseObject.restaurant.city+'<br><span id="restaurantTotalRatings"></span> ratings</span><!--<a class="newDish">add dish</a>--></div>';
             Ext.getCmp('restInfoPnl').update(htmlString);

            var placeholder = new google.maps.Marker(
                {
                    position: new google.maps.LatLng(responseObject.restaurant.latitude,responseObject.restaurant.longitude),
                    map: Ext.getCmp('googleMap').map,
                    title: 'restaurant'
                }
            );
            // woah baby, this is a nasty hack but the map refuses to behave unless you trigger resize after a delay AFTER the initial ajax returns
            Ext.Ajax.request({
                url: (urlPrefix+'/places/'+record.data.id+'.json'),
                reader: {
                     type: 'json'
                },
                success: function(response) {
                    google.maps.event.trigger(Ext.getCmp('googleMap').map, 'resize');
                    var initialLocation = new google.maps.LatLng(responseObject.restaurant.latitude,responseObject.restaurant.longitude);
                    Ext.getCmp('googleMap').update(initialLocation);
                    //needs work becoming resuable, maybe have to destroy this on unload
                }
            });
        }
    });
}

function starDisplay(rating) {
    return '<img src="../images/ratings/rating-dish-'+parseInt(rating)+'.png">';
}
var newRestaurant = new Ext.form.FormPanel({
    scroll: 'vertical',
    dockedItems:[
       {
           dock:'top',
           xtype:'toolbar',
           ui:'light',
           title:'Crave',
           items:[{text:'Back',ui:'back', handler:backHandler}]
       }
    ],
    items: [
       {xtype: 'fieldset', title: 'New Restaurant', items: [
            {
                xtype: 'textfield',
                label:'Name',
                name: 'restaurant[name]',
                id: 'restaurantName'
		    },
           {xtype: 'textfield', name: 'restaurant[latitude]', id: 'latfield', hidden: true},
           {xtype: 'textfield', name: 'restaurant[longitude]', id: 'lngfield', hidden: true},
           {
               xtype: 'textfield',
               label:'Address',
               name: 'restaurant[street_address]',
               id: 'restaurantAddress'
           },
           {
               xtype: 'textfield',
               label:'Neighborhood',
               name: 'restaurant[neighborhood]',
               id: 'restaurantNeighborhood'
           },
           {
               xtype: 'textfield',
               label:'City',
               value: 'San Francisco',
               name: 'restaurant[city]',
               id: 'restaurantCity'
           },
           {
               xtype: 'textfield',
               value: 'CA',
               label:'State',
               name: 'restaurant[state]',
               id: 'restaurantState'
           },
           {
               xtype: 'textfield',
               label:'Zip',
               name: 'restaurant[zip]',
               id: 'restaurantZip'
           },
           {
               xtype: 'textfield',
               label:'Country',
               value: 'USA',
               name: 'restaurant[country]',
               id: 'restaurantCountry'
           },
           {
               xtype: 'textfield',
               label:'Cross Street',
               name: 'restaurant[cross_street]',
               id: 'restaurantCross'
           },
           {
               xtype:'button',
               text: 'Submit',
               handler: function() {
                   var s = Ext.getCmp('restaurantAddress').getValue()+" "+Ext.getCmp('restaurantCity').getValue()+" "+Ext.getCmp('restaurantState').getValue()+" "+Ext.getCmp('restaurantZip').getValue();

                   var geocoder = new google.maps.Geocoder();
                   geocoder.geocode( { 'address': s}, function(results, status) {
                       if (status == google.maps.GeocoderStatus.OK) {
                           stringLocation = results[0].geometry.location.toString().replace("(","").replace(")","");
                           coordsArray = stringLocation.split(",");
                           Ext.getCmp('latfield').setValue($.trim(coordsArray[0]));
                           Ext.getCmp('lngfield').setValue($.trim(coordsArray[1]));
                           newRestaurant.submit({
                               url: '/places',
                               method: 'post',
                               submitDisabled: true,
                               waitMsg: 'Saving Data...Please wait.',
                               success: function (objForm,httpRequest) {
                                   var mbox = new Ext.MessageBox({});
                                   mbox.alert("Record Saved");
                                   //redirect back to restaurant list?
                               },
                               failure: function() {
                                   console.log('submissionFailed');
                               }
                           })
                       } else {
                           alert("Cannot resolve that address for the following reason: " + status);
                       }
                   });
               }
           }
        ]}
    ]
});

var reviewForm = new Ext.form.FormPanel({
    fullScreen:true,
           items: [
            {
            xtype: 'textfield',
            name: 'menu_item_rating[rating]',
                id:'menuRating',
                hidden:true
            },
            {
                xtype: 'textfield',
                name: 'menu_item_rating[review]',
                width:'100%',
                height:'200',
                placeHolder: 'Write a review',
                cls:'reviewField',
                id: 'review'
		    },
           {
               xtype: 'textfield',
               name: 'menu_item_rating[menu_item_id]',
               id: 'menuId',
               hidden:true
           },
           {
               xtype: 'textfield',
               name: 'menu_item_rating[user_id]',
               id: 'userId',
               hidden:true
           }
       ]
});

var reviewFormPnl = new Ext.Panel({
    id: 'reviewFormPnl',
    dockedItems:[
        {
            dock:'top',
            xtype:'toolbar',
            ui:'light',
            title:'<img class="cravelogo" src="../images/crave-logo-horizontal-white.png">',
             layout: {
                 type: 'hbox',
                 pack:'justify'
             },
            items:[{text:'Back',ui:'back', handler:backHandler},{text:'Submit',ui:'normal', handler:rateHandler}]
        }
    ],
    items: [
        {
            html: '<div class="starContainer"><div class="starLabel">Have you tried this</div><div class="starRating ratingOf0"><button class="starcover" id="id-star1"></button><button class="starcover" id="id-star2"></button><button class="starcover" id="id-star3"></button><button class="starcover" id="id-star4"></button><button class="starcover" id="id-star5"></button></div></div>',
            height:'80',
            width:'100%'
        },
            reviewForm
    ]
});


function dishDisplay(response) {
    var responseObject = eval('(' + response.responseText + ')');
    //instead of making this into a string I should create javascript object, apply template
    htmlString = '<div class="dishinfo"><b>'+responseObject.menu_item.name+'</b><br/>';
    htmlString += '@'+responseObject.menu_item.restaurant.name+'<br>';
    //htmlString += '$ '+responseObject.menu_item.price+'<br>';
    if(responseObject.menu_item.menu_item_avg_rating_count) {
        htmlString += starDisplay(responseObject.menu_item.menu_item_avg_rating_count.avg_rating);
        htmlString += ' '+responseObject.menu_item.menu_item_avg_rating_count.count+' ratings';
    }
    if(responseObject.menu_item.description!="") {
        htmlString += '<div class="dataSection"><div class="sectionHead">Description</div><div class="sectionBody">'+responseObject.menu_item.description+'</div></div>';
    }
    /*for(i=0;i<responseObject[0].ingredients.length;i++) {
     htmlString += responseObject[0].ingredients[i].item;
        if(i<responseObject[0].ingredients.length - 1) {
            htmlString += ", ";
        }
    }*/
    htmlString += "</div>";
    /*
    for(i=0;i<responseObject[0].images.length;i++) {
        object = new Object();
        object.html = '<div class="foodImg"><img width="100" src="'+responseObject[0].images[i].file+'"></div>';
        object.xtype = 'panel';
        Ext.getCmp('carouselPnl').add(object);
    }
    */
    if(responseObject.menu_item.menu_item_ratings) {
        reviewString = '<div class="dataSection"><div class="sectionHead">Reviews</div><div class="sectionBody">';
        for(i=0;i<responseObject.menu_item.menu_item_ratings.length;i++) {


            reviewString += '<div class="picanddata">';
            reviewString += '<div class="pic"><img src="'+responseObject.menu_item.menu_item_ratings[i].user.user_profile_pic_url+'"></div>';
            reviewString += '<div class="data"><div class="username">'+responseObject.menu_item.menu_item_ratings[i].user.user_name+'</div>'+starDisplay(responseObject.menu_item.menu_item_ratings[i].rating)+'</div>';
            reviewString += '<div class="reviewtext">'+responseObject.menu_item.menu_item_ratings[i].review+'</div>';
            reviewString += '</div>';
        }
        reviewString += '</div></div>';
        Ext.getCmp('detailPnl').add(reviewPnl);
        Ext.getCmp('reviewPnl').update(reviewString);
    }
    //Ext.getCmp('detailPnl').add(carouselPnl);
    Ext.getCmp('infoPnl').update(htmlString);
    myUID = localStorage.getItem("uid");
    if(myUID!="" && myUID!=null) {
        //Ext.getCmp('detailPnl').add(reviewForm);
        Ext.getCmp('userId').setValue(myUID);
        Ext.getCmp('menuId').setValue(responseObject.menu_item.id);
    }
    Ext.getCmp('detailPnl').doLayout();
}

var aRestaurantList = new Ext.List({
    id:'aRestaurantList',
    itemTpl: restaurantDishTemplate,
    singleSelect: true,
    grouped: true,
    indexBar: false,
    layout:{type:'vbox'},
    fullscreen:false,
    store: singleRestaurantStore,

    width:'100%',
    height:'334px',
    modal:true,
    hideOnMaskTap: false
});

aRestaurantList.on('itemtap', function(dataView, index, item, e) {
    record = dataView.store.data.items[index];
    console.log(urlPrefix+'/items/'+record.data.id+'.json');
    Ext.Ajax.request({
        url: (urlPrefix+'/items/'+record.data.id+'.json'),
        reader: {
             type: 'json'
        },
        success: function(response) {
            dishDisplay(response);
        }
    });
    Ext.getCmp('mainPnl').setActiveItem(0);
});
