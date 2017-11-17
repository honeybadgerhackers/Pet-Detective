angular.module('pet-detective')
  .controller('petFormController', function ($http, $window, formDataFactory) {
    this.profileInfo = JSON.parse(localStorage.getItem('userProfile'));
    this.profileName = this.profileInfo.ofa;
    this.email = localStorage.getItem('userEmail');
    this.place = '';
    this.formBody = '';
    this.type = null;
    this.latlong = null;
    this.markers = {};
    this.img = null;
    this.tags = [];
    this.selectDistance = [
      { id: null, text: 'none' },
      { id: 2, text: '2 miles' },
      { id: 5, text: '5 miles' },
      { id: 10, text: '10 miles' },
      { id: 25, text: '25 miles' },
      { id: 50, text: '50 miles' },
    ];
    this.selectedSpecies = '';
    this.lostStatus = '';
    this.speciesList = ['Cat', 'Dog', 'Bird', 'Lizard', 'Snake', 'Hamster', 'Guinea pig', 'Fish', 'Other'];
    this.missingField = '';
    this.infoWindow = null;
    this.noResultText = false;
    this.render = async function () {
      this.bulletinData = await formDataFactory.fetchFormData();
      this.createMap();
      return this.bulletinData;
    };


    this.fetchSearchResults = function (search, distance) {
      if (search) {
        this.noResultText = false;
        return $http({
          url: '/search',
          method: 'POST',
          data: {
            searchField: search,
            distance,
          },
        })
          .then(({ data }) => {
            if (data.length) {
              this.bulletinData = data;
              this.placeMarkers();
            } else {
              this.noResultText = true;
            }
            this.searchTerm = '';
            this.searchDistance = this.selectDistance[0];
          }, (err) => {
            console.error(err);
          });
      }
      return null;
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
          this.placeMarkers();
        });
    };
    this.loadTags = () => $http.get('./searchTags/petTags.json');

    this.addMarker = function ({ id, lostOrFound, lat, long }) {
      const blueMarker = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|0000FF');
      const redMarker = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|ff0000');

      const marker = new google.maps.Marker({
        map: this.mymapdetail,
        position: new google.maps.LatLng(lat, long),
        title: this.woa.city,
        icon: lostOrFound === 'Lost' ? redMarker : blueMarker,
      });
      this.markers[id] = marker;
      return marker;
    };

    this.placeMarkers = () => {
      this.bulletinData.forEach((bulletin) => {
        const cord = bulletin.latlong.split(',');
        bulletin.lat = cord[0];
        bulletin.long = cord[1];
        const sco = this;
        const map = this.mymapdetail;
        const marker = this.addMarker(bulletin);
        const img = bulletin.petPic;
        google.maps.event.addListener(marker, 'click', () => {
          const infowindow = new google.maps.InfoWindow({
            content: `<div>${bulletin.message}</div>
                      <img src=${img} style="width:35px;length:35px"/>`,
          });
          if (sco.open) {
            sco.open.close();
          }
          infowindow.open(map, marker);
          sco.open = infowindow;
        });
      });
    };

    this.createMap = (lat = 39.5, long = -96.35) => {
      this.woa = {
        city: 'PET',
      };
      // set up map
      this.mapOptions = {
        zoom: 3,
        center: new google.maps.LatLng(lat, long),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      };

      this.mymapdetail = new google.maps.Map(document.getElementById('map-canvas'), this.mapOptions);

      this.placeMarkers();

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          this.mymapdetail.setCenter(pos);
          this.mymapdetail.setZoom(12);
        });
      }
    };

    this.bullClick = ({ lat, long }) => {
      const latLng = new google.maps.LatLng(lat, long);
      this.mymapdetail.setCenter(latLng);
      this.mymapdetail.setZoom(12);
    };

    this.deletePost = (bully) => {
      const id = bully.id;
      $http.post('/deletePost', bully)
        .then(formDataFactory.fetchFormData)
        .then((bulletins) => {
          this.bulletinData = bulletins;
          this.markers[id].setMap(null);
          delete this.markers[id];
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

