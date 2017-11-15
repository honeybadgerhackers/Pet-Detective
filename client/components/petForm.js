angular.module('pet-detective')
  .controller('petFormController', function ($http, $window, formDataFactory) {
    this.profileInfo = JSON.parse(localStorage.getItem('userProfile'));
    this.profileName = this.profileInfo.ofa;
    this.email = localStorage.getItem('userEmail');
    this.place = '';
    this.formBody = '';
    this.type = null;
    this.latlong = null;
    this.img = null;
    this.tags = [];
    this.selectedSpecies = '';
    this.lostStatus = '';
    this.speciesList = ['Cat', 'Dog', 'Bird', 'Lizard', 'Snake', 'Hamster', 'Guinea pig', 'Fish', 'Other'];
    this.missingField = '';
    this.render = async function () {
      this.bulletinData = await formDataFactory.fetchFormData();
      this.createMap();
      return this.bulletinData;
    };

    this.fetchSearchResults = function (search) {
      return $http({
        url: '/search',
        method: 'POST',
        data: {
          searchField: search,
        },
      })
        .then((response) => {
          this.bulletinData = response.data;
          this.createMap();
        }, (err) => {
          console.error(err);
        });
    };

    this.render = async function () {
      this.bulletinData = await formDataFactory.fetchFormData();
      this.createMap();
      return this.bulletinData;
    };

    this.submit = function (place, formBody /* , img, date , style */) {
      if (!this.lostStatus || !this.selectedSpecies) {
        this.missingField = !this.lostStatus ? 'Lost or Found field required' : 'Animal Type Field Required';
        return;
      }
      this.date = new Date()
        .toString()
        .split(' ')
        .splice(1, 3)
        .join(' ');
      $http({
        url: '/bulletin',
        method: 'POST',
        data: {
          user: this.email,
          userpic: this.profileInfo.Paa,
          lostOrFound: this.lostStatus,
          type: this.selectedSpecies,
          address: this.place.formatted_address,
          message: formBody,
          date: this.date,
          styles: this.tags.map(tag => ` ${tag.text}`),
          latlong: [this.place.geometry.location.lat(), this.place.geometry.location.lng()],
          petPic: window.imgSrc,
        },
      })
        .then(formDataFactory.fetchFormData)
        .then((bulletins) => {
          this.bulletinData = bulletins;
          this.selectedSpecies = null;
          this.lostStatus = null;
          this.formBody = null;
          this.address = null;
          this.tags = [];
          this.img = null;
          this.missingField = '';
          this.createMap();
        });
    };
    this.loadTags = () => $http.get('./searchTags/petTags.json');
    this.createMap = (lat = 29.945947, long = -90.070023) => {
      this.woa = {
        city: 'PET',
      };
      // set up new marker images
      const blueMarker = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_constter&chld=%E2%80%A2|0000FF');
      const redMarker = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|ff0000');

      // set up map
      this.mapOptions = {
        zoom: 12,
        center: new google.maps.LatLng(lat, long),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      };

      this.mymapdetail = new google.maps.Map(document.getElementById('map-canvas'), this.mapOptions);

      this.bulletinData.forEach((obj) => {
        const cord = obj.latlong.split(',');
        obj.lat = cord[0];
        obj.long = cord[1];
      });

      for (let i = 0; i < this.bulletinData.length; i += 1) {
        this.addMarker = function () {
          this.mymarker = new google.maps.Marker({
            map: this.mymapdetail,
            // animation: google.maps.Animation.DROP,
            position: new google.maps.LatLng(this.bulletinData[i].lat, this.bulletinData[i].long),
            title: this.woa.city,
            icon: this.bulletinData[i].lostOrFound === 'Lost' ? redMarker : blueMarker,
          });
        };
        this.addMarker();
        const sco = this;
        const map = this.mymapdetail;
        const marker = this.mymarker;
        const img = this.bulletinData[i].petPic;
        google.maps.event.addListener(sco.mymarker, 'click', () => {
          const infowindow = new google.maps.InfoWindow({
            content: `<div>${sco.bulletinData[i].message}</div>
                      <img src=${img} style="width:35px;length:35px"/>`,
          });
          if (sco.open) {
            sco.open.close();
          }
          infowindow.open(map, marker);
          sco.open = infowindow;
        });
      }
    };
    this.bullClick = (bull) => {
      this.createMap(bull.lat, bull.long);
    };

    this.deletePost = (bully) => {
      $http.post('/deletePost', bully)
        .then(formDataFactory.fetchFormData)
        .then((bulletins) => {
          this.bulletinData = bulletins;
          this.createMap();
        });
    };
    this.modal = (img) => {
      $('#imagepreview').attr('src', img); // here asign the image to the modal when the user click the enlarge link
      $('#imagemodal').modal('show');
    };
  })
  .directive('petForm', function petFormDirective() {
    return {
      scope: {
        bulletinData: '<',
      },
      restrict: 'E',
      controller: 'petFormController',
      controllerAs: 'ctrl',
      bindToController: true,
      templateUrl: 'components/petForm.html',
    };
  });

